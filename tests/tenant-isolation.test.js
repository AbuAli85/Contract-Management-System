#!/usr/bin/env node
/**
 * Tenant Isolation Integration Test
 *
 * Asserts: User in Tenant B cannot access resources belonging to Tenant A.
 * Catches: missing tenant filters, broken RLS, companyId resolution bugs.
 *
 * Policy: Cross-tenant object fetch → expect 404 (no resource existence leakage).
 *
 * Requires (env):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   TEST_TENANT_A_EMAIL, TEST_TENANT_A_PASSWORD  (user in company A)
 *   TEST_TENANT_B_EMAIL, TEST_TENANT_B_PASSWORD  (user in company B)
 *   API_BASE_URL (default: http://localhost:3000)
 *
 * CONTRACT_ID_TENANT_A: required in all environments (deterministic). No fetch fallback.
 * TENANT_TEST_ENFORCE_404: when 1, fail on 403 (enforce 404-only policy).
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TIMEOUT_MS = 10000;

async function getToken(email, password) {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required');
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`);
  if (!data.session?.access_token) throw new Error(`No token for ${email}`);
  return data.session.access_token;
}

function apiRequest(path, token, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(path, BASE_URL);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

async function main() {
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const tenantAEmail = process.env.TEST_TENANT_A_EMAIL;
  const tenantAPass = process.env.TEST_TENANT_A_PASSWORD;
  const tenantBEmail = process.env.TEST_TENANT_B_EMAIL;
  const tenantBPass = process.env.TEST_TENANT_B_PASSWORD;
  const hasCreds = tenantAEmail && tenantAPass && tenantBEmail && tenantBPass;

  const contractId = process.env.CONTRACT_ID_TENANT_A;
  if (!hasCreds) {
    if (isCI) {
      console.error('❌ Tenant isolation test: missing env vars in CI. Configure TEST_TENANT_A_*, TEST_TENANT_B_* secrets.');
      process.exit(1);
    }
    console.log('⏭️  Skipping tenant isolation test: missing env vars.');
    console.log('   Set TEST_TENANT_A_EMAIL, TEST_TENANT_A_PASSWORD, TEST_TENANT_B_EMAIL, TEST_TENANT_B_PASSWORD, CONTRACT_ID_TENANT_A');
    process.exit(0);
  }
  if (!contractId) {
    console.error('❌ CONTRACT_ID_TENANT_A is required. Set it to a contract ID belonging to Tenant A.');
    process.exit(1);
  }

  console.log('🔐 Tenant isolation test: cross-tenant access must return 404\n');

  let tokenA;
  let tokenB;
  try {
    tokenA = await getToken(tenantAEmail, tenantAPass);
    tokenB = await getToken(tenantBEmail, tenantBPass);
  } catch (err) {
    console.error('❌ Auth failed:', err.message);
    process.exit(1);
  }

  const res = await apiRequest(`/api/contracts/${contractId}`, tokenB);
  const enforce404 = process.env.TENANT_TEST_ENFORCE_404 === '1' || process.env.TENANT_TEST_ENFORCE_404 === 'true';

  // Policy: 404 for cross-tenant object fetch (no existence leakage)
  if (res.status === 404) {
    console.log('✅ Cross-tenant access denied (404) — tenant isolation OK');
    process.exit(0);
  }

  if (res.status === 403) {
    if (enforce404) {
      console.error('❌ Got 403; TENANT_TEST_ENFORCE_404=1 requires 404. Standardize APIs to return 404 for cross-tenant fetches.');
      process.exit(1);
    }
    console.log('⚠️  Got 403 (acceptable). Set TENANT_TEST_ENFORCE_404=1 to enforce 404-only.');
    process.exit(0);
  }

  if (res.status === 200) {
    console.error('❌ Tenant B accessed Tenant A contract — isolation broken');
    process.exit(1);
  }

  console.error(`❌ Unexpected status ${res.status}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
