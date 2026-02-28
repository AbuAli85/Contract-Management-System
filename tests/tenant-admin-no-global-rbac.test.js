#!/usr/bin/env node
/**
 * Regression: Tenant admin cannot grant global RBAC
 *
 * Asserts: A tenant admin calling POST /api/users/management (update_role)
 * only changes tenant membership (user_roles), not platform RBAC (user_role_assignments).
 * Verification: After the tenant admin "updates role", the target user still cannot
 * access platform-admin-only endpoints (e.g. GET /api/admin/users/[userId]/roles).
 *
 * Requires (env):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   TEST_TENANT_ADMIN_EMAIL, TEST_TENANT_ADMIN_PASSWORD  (admin/manager in a company)
 *   TEST_TARGET_USER_EMAIL, TEST_TARGET_USER_PASSWORD    (user in same company, not platform admin)
 *   API_BASE_URL (default: http://localhost:3000)
 *
 * In CI: fail if env missing. Locally: skip.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TIMEOUT_MS = 15000;

async function getToken(email, password) {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required');
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`);
  if (!data.session?.access_token) throw new Error(`No token for ${email}`);
  return { token: data.session.access_token, userId: data.user?.id };
}

function apiRequest(path, token, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(path, BASE_URL);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: TIMEOUT_MS,
    };
    const req = protocol.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const adminEmail = process.env.TEST_TENANT_ADMIN_EMAIL;
  const adminPass = process.env.TEST_TENANT_ADMIN_PASSWORD;
  const targetEmail = process.env.TEST_TARGET_USER_EMAIL;
  const targetPass = process.env.TEST_TARGET_USER_PASSWORD;

  if (!adminEmail || !adminPass || !targetEmail || !targetPass) {
    if (isCI) {
      console.error('❌ Tenant admin RBAC test: missing env. Set TEST_TENANT_ADMIN_EMAIL, TEST_TENANT_ADMIN_PASSWORD, TEST_TARGET_USER_EMAIL, TEST_TARGET_USER_PASSWORD.');
      process.exit(1);
    }
    console.log('⏭️  Skipping tenant-admin-no-global-rbac test: missing env vars.');
    process.exit(0);
  }

  console.log('🔐 Tenant admin cannot grant global RBAC — regression test\n');

  let adminSession;
  let targetSession;
  try {
    adminSession = await getToken(adminEmail, adminPass);
    targetSession = await getToken(targetEmail, targetPass);
  } catch (err) {
    console.error('❌ Auth failed:', err.message);
    process.exit(1);
  }

  const targetUserId = targetSession.userId;
  if (!targetUserId) {
    console.error('❌ Could not get target user id');
    process.exit(1);
  }

  // 1) Tenant admin calls update_role on target user (tenant membership only)
  const updateRes = await apiRequest('/api/users/management', adminSession.token, 'POST', {
    action: 'update_role',
    userId: targetUserId,
    role: 'client',
  });

  if (updateRes.status !== 200) {
    console.error(`❌ Tenant admin update_role expected 200, got ${updateRes.status}`, updateRes.data);
    process.exit(1);
  }
  console.log('   POST /api/users/management (update_role) → 200 ✓');

  // 2) Tenant path worked: list users as tenant admin and confirm target user has updated role
  const listRes = await apiRequest('/api/users/management?limit=100', adminSession.token, 'GET');
  if (listRes.status === 200 && listRes.data?.users) {
    const targetInList = listRes.data.users.find((u) => u.id === targetUserId);
    if (targetInList && Array.isArray(targetInList.roles) && targetInList.roles.includes('client')) {
      console.log('   GET /api/users/management: target user has role "client" ✓');
    } else if (targetInList) {
      console.log('   GET /api/users/management: target user in list (roles: ' + (targetInList.roles?.join(',') || '') + ')');
    }
  }

  // 3) Target user must still be denied on platform-admin-only endpoint (user_role_assignments not changed)
  const platformRes = await apiRequest(
    `/api/admin/users/${targetUserId}/roles`,
    targetSession.token,
    'GET'
  );

  if (platformRes.status !== 403) {
    console.error(
      `❌ Target user should still be denied on platform admin API (expected 403, got ${platformRes.status}). ` +
      'Tenant admin must not have granted global RBAC.'
    );
    process.exit(1);
  }
  console.log('   GET /api/admin/users/[userId]/roles as target user → 403 ✓ (no global RBAC)');

  console.log('\n✅ Tenant admin cannot grant global RBAC — regression OK');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
