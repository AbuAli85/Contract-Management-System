/**
 * SSO Configuration Verification Script
 * 
 * This script verifies that all Supabase clients are configured correctly
 * for Single Sign-On (SSO) across platforms.
 * 
 * Usage:
 *   npx tsx scripts/verify-sso-config.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REQUIRED_STORAGE_KEY = 'sb-auth-token';
const REQUIRED_AUTH_CONFIG = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  storageKey: REQUIRED_STORAGE_KEY,
};

interface VerificationResult {
  file: string;
  exists: boolean;
  hasStorageKey: boolean;
  hasAuthConfig: boolean;
  issues: string[];
  status: '✅ PASS' | '❌ FAIL' | '⚠️ WARNING';
}

const clientFiles = [
  'lib/supabase/client.ts',
  'lib/supabaseClient.ts',
  'lib/supabase/client-pages.ts',
];

function verifyFile(filePath: string): VerificationResult {
  const fullPath = join(process.cwd(), filePath);
  const result: VerificationResult = {
    file: filePath,
    exists: false,
    hasStorageKey: false,
    hasAuthConfig: false,
    issues: [],
    status: '❌ FAIL',
  };

  if (!existsSync(fullPath)) {
    result.issues.push('File does not exist');
    return result;
  }

  result.exists = true;
  const content = readFileSync(fullPath, 'utf-8');

  // Check for storageKey
  if (content.includes(`storageKey: '${REQUIRED_STORAGE_KEY}'`) || 
      content.includes(`storageKey: "${REQUIRED_STORAGE_KEY}"`)) {
    result.hasStorageKey = true;
  } else {
    result.issues.push(`Missing storageKey: '${REQUIRED_STORAGE_KEY}'`);
  }

  // Check for localStorage storage
  if (content.includes('window.localStorage') || content.includes('localStorage')) {
    // Good, but verify it's in the right context
    if (!content.includes('storage:') && !content.includes('localStorage.setItem')) {
      result.issues.push('localStorage referenced but not configured in auth.storage');
    }
  } else {
    result.issues.push('Missing localStorage storage configuration');
  }

  // Check for other required auth config
  if (content.includes('persistSession: true')) {
    result.hasAuthConfig = true;
  } else {
    result.issues.push('Missing persistSession: true');
  }

  if (!content.includes('autoRefreshToken: true')) {
    result.issues.push('Missing autoRefreshToken: true');
  }

  if (!content.includes('detectSessionInUrl: true')) {
    result.issues.push('Missing detectSessionInUrl: true');
  }

  // Determine status
  if (result.hasStorageKey && result.hasAuthConfig && result.issues.length === 0) {
    result.status = '✅ PASS';
  } else if (result.hasStorageKey && result.issues.length <= 2) {
    result.status = '⚠️ WARNING';
  } else {
    result.status = '❌ FAIL';
  }

  return result;
}

function main() {
  console.log('🔍 SSO Configuration Verification\n');
  console.log('Checking Supabase client files for SSO configuration...\n');
  console.log(`Required storageKey: '${REQUIRED_STORAGE_KEY}'\n`);
  console.log('─'.repeat(80));

  const results: VerificationResult[] = [];
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  for (const file of clientFiles) {
    const result = verifyFile(file);
    results.push(result);

    console.log(`\n📄 ${result.file}`);
    console.log(`   Status: ${result.status}`);

    if (result.exists) {
      console.log(`   ✅ File exists`);
      console.log(`   ${result.hasStorageKey ? '✅' : '❌'} Has storageKey: '${REQUIRED_STORAGE_KEY}'`);
      console.log(`   ${result.hasAuthConfig ? '✅' : '❌'} Has auth configuration`);
    } else {
      console.log(`   ❌ File not found`);
    }

    if (result.issues.length > 0) {
      console.log(`   Issues:`);
      result.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    }

    if (result.status === '✅ PASS') passCount++;
    else if (result.status === '❌ FAIL') failCount++;
    else warningCount++;
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Pass: ${passCount}`);
  console.log(`   ⚠️  Warning: ${warningCount}`);
  console.log(`   ❌ Fail: ${failCount}`);

  if (failCount === 0 && warningCount === 0) {
    console.log('\n🎉 All files are correctly configured for SSO!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Verify business-services-hub has the same configuration');
    console.log('   2. Test SSO by logging in on one platform');
    console.log('   3. Check localStorage in browser console: localStorage.getItem("sb-auth-token")');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some files need updates. See issues above.');
    console.log('\n📋 Fix Instructions:');
    console.log('   1. Update each failing file to include:');
    console.log(`      storageKey: '${REQUIRED_STORAGE_KEY}'`);
    console.log('      storage: typeof window !== "undefined" ? window.localStorage : undefined');
    console.log('   2. Ensure all auth config includes:');
    console.log('      - persistSession: true');
    console.log('      - autoRefreshToken: true');
    console.log('      - detectSessionInUrl: true');
    process.exit(1);
  }
}

main();

