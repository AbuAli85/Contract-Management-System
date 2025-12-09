#!/usr/bin/env node

/**
 * 🔒 Production Security Verification Script
 *
 * This script verifies that test account buttons are properly hidden in production.
 * Run this before deploying to production.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Production Security Verification');
console.log('=====================================\n');

let hasErrors = false;
let hasWarnings = false;

// Files to check
const filesToCheck = [
  'components/auth/enhanced-login-form-v2.tsx',
  'components/auth/unified-login-form.tsx',
];

// Check 1: Verify environment check exists in login components
console.log('✓ Checking login components for proper environment guards...\n');

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Warning: ${file} not found`);
    hasWarnings = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for test account buttons
  const hasTestButtons =
    content.includes('Test Provider') ||
    content.includes('Test Client') ||
    content.includes('Test Admin');

  if (hasTestButtons) {
    // Check for proper environment guards
    const hasDualCheck =
      content.includes("process.env.NODE_ENV === 'development'") &&
      content.includes(
        "process.env.NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS === 'true'"
      );

    if (hasDualCheck) {
      console.log(
        `✅ ${file}: Test buttons properly guarded with dual environment check`
      );
    } else {
      console.log(`❌ ${file}: Test buttons found but NOT properly guarded!`);
      hasErrors = true;
    }

    // Check for security comments
    const hasSecurityComments =
      content.includes('Test accounts are only available in development') &&
      content.includes('They are hidden in production for security reasons');

    if (hasSecurityComments) {
      console.log(`   ✅ Security comments present`);
    } else {
      console.log(`   ⚠️  Security comments missing`);
      hasWarnings = true;
    }
  } else {
    console.log(`✅ ${file}: No test buttons found`);
  }
});

// Check 2: Verify environment configuration files
console.log('\n✓ Checking environment configuration files...\n');

const envFiles = [
  { file: 'env.example', expectedValue: 'true', env: 'development' },
  { file: 'env.production.example', expectedValue: 'false', env: 'production' },
];

envFiles.forEach(({ file, expectedValue, env }) => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Warning: ${file} not found`);
    hasWarnings = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes('NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS')) {
    const match = content.match(/NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS\s*=\s*(\w+)/);
    if (match) {
      const actualValue = match[1];
      if (actualValue === expectedValue) {
        console.log(
          `✅ ${file}: NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=${actualValue} (correct for ${env})`
        );
      } else {
        console.log(
          `❌ ${file}: NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=${actualValue} (should be ${expectedValue} for ${env})`
        );
        hasErrors = true;
      }
    }

    // Check for security warnings
    const hasSecurityWarning =
      content.includes('SECURITY') ||
      content.includes('security risk') ||
      content.includes('NEVER');

    if (hasSecurityWarning) {
      console.log(`   ✅ Security warnings present`);
    } else {
      console.log(`   ⚠️  Security warnings missing`);
      hasWarnings = true;
    }
  } else {
    console.log(
      `❌ ${file}: NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS variable not found`
    );
    hasErrors = true;
  }
});

// Check 3: Verify current environment (if .env.local exists)
console.log('\n✓ Checking current environment configuration...\n');

const localEnvPath = path.join(__dirname, '.env.local');
if (fs.existsSync(localEnvPath)) {
  const content = fs.readFileSync(localEnvPath, 'utf-8');

  if (content.includes('NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS')) {
    const match = content.match(/NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS\s*=\s*(\w+)/);
    if (match) {
      const value = match[1];
      if (value === 'true') {
        console.log(`ℹ️  .env.local: Test accounts ENABLED (development mode)`);
      } else {
        console.log(`✅ .env.local: Test accounts DISABLED (production mode)`);
      }
    }
  } else {
    console.log(
      `✅ .env.local: NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS not set (test accounts disabled)`
    );
  }
} else {
  console.log(`ℹ️  .env.local not found (this is normal)`);
}

// Check 4: Production environment variables guide
console.log('\n✓ Production deployment checklist...\n');

console.log('📋 Before deploying to production, ensure:');
console.log('   1. Set NODE_ENV=production in Vercel');
console.log(
  '   2. Set NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false in Vercel (or delete it)'
);
console.log('   3. Clear browser cache after deployment');
console.log('   4. Verify test buttons are NOT visible on login page\n');

// Summary
console.log('\n═══════════════════════════════════════');
console.log('📊 Verification Summary');
console.log('═══════════════════════════════════════\n');

if (hasErrors) {
  console.log('❌ ERRORS FOUND - Fix these issues before deploying!');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS FOUND - Review these before deploying');
  console.log('✅ No critical errors found\n');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED - Safe to deploy!');
  console.log('✅ Test account buttons are properly secured\n');
  process.exit(0);
}
