#!/usr/bin/env node
/**
 * Non-Admin Denied on Admin APIs — Integration Test
 *
 * Asserts: User with tenant role provider/client cannot access admin APIs.
 * Catches: wrong permission strings, guard too permissive, miswired role matrices.
 *
 * Requires (env):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   TEST_NON_ADMIN_EMAIL, TEST_NON_ADMIN_PASSWORD  (user with role provider or client)
 *   API_BASE_URL (default: http://localhost:3000)
 *
 * In CI: fail if env missing. Locally: skip.
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

const ADMIN_ENDPOINTS = [
  { path: '/api/users/management', method: 'GET' },
  { path: '/api/audit-logs', method: 'GET' },
  { path: '/api/roles', method: 'GET' },
];

async function main() {
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const email = process.env.TEST_NON_ADMIN_EMAIL;
  const password = process.env.TEST_NON_ADMIN_PASSWORD;

  if (!email || !password) {
    if (isCI) {
      console.error('❌ Non-admin denied test: missing env. Configure TEST_NON_ADMIN_EMAIL, TEST_NON_ADMIN_PASSWORD.');
      process.exit(1);
    }
    console.log('⏭️  Skipping non-admin denied test: missing env vars.');
    process.exit(0);
  }

  console.log('🔐 Non-admin denied test: provider/client must get 403 on admin APIs\n');

  let token;
  try {
    token = await getToken(email, password);
  } catch (err) {
    console.error('❌ Auth failed:', err.message);
    process.exit(1);
  }

  // Policy: authenticated user without permission → 403. 401 would indicate auth/token problem.
  for (const { path, method } of ADMIN_ENDPOINTS) {
    const res = await apiRequest(path, token, method);
    if (res.status === 401) {
      console.error(`❌ ${method} ${path}: got 401 (auth problem). Expected 403 for authenticated user without permission.`);
      process.exit(1);
    }
    if (res.status !== 403) {
      console.error(`❌ ${method} ${path}: expected 403, got ${res.status}`);
      process.exit(1);
    }
    console.log(`   ${method} ${path} → 403 ✓`);
  }

  console.log('\n✅ Non-admin denied on admin APIs — RBAC OK');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
