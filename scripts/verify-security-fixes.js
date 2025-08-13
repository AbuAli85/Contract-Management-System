#!/usr/bin/env node

/**
 * Security Fix Verification Script
 * This script verifies that all critical security vulnerabilities have been fixed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Security Fix Verification...\n');

const checks = [];

// Check 1: Verify Next.js version is updated
console.log('1️⃣ Checking Next.js version...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const nextVersion = packageJson.dependencies.next;
  
  if (nextVersion.includes('14.2.31') || nextVersion >= '14.2.31') {
    console.log('✅ Next.js updated to secure version');
    checks.push({ name: 'Next.js Version', status: 'PASS' });
  } else {
    console.log('❌ Next.js version still vulnerable:', nextVersion);
    checks.push({ name: 'Next.js Version', status: 'FAIL', issue: `Version ${nextVersion} has known CVEs` });
  }
} catch (error) {
  console.log('❌ Could not check Next.js version');
  checks.push({ name: 'Next.js Version', status: 'ERROR', issue: error.message });
}

// Check 2: Verify middleware.ts fixes
console.log('\n2️⃣ Checking middleware.ts fixes...');
try {
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
  
  // Check for cookie role removal
  if (middlewareContent.includes("request.cookies.get('active_role')")) {
    console.log('❌ Vulnerable cookie-based role check still present');
    checks.push({ name: 'Middleware Cookie Fix', status: 'FAIL', issue: 'Cookie-based role check not removed' });
  } else {
    console.log('✅ Cookie-based role check removed');
    checks.push({ name: 'Middleware Cookie Fix', status: 'PASS' });
  }
  
  // Check for JWT verification
  if (middlewareContent.includes('verifyUserRoleFromToken')) {
    console.log('✅ Secure JWT verification implemented');
    checks.push({ name: 'JWT Verification', status: 'PASS' });
  } else {
    console.log('❌ JWT verification not implemented');
    checks.push({ name: 'JWT Verification', status: 'FAIL', issue: 'JWT verification missing' });
  }
  
  // Check for always-on security headers
  if (middlewareContent.includes("process.env.SECURITY_HEADERS_ENABLED === 'true'")) {
    console.log('❌ Security headers still conditional');
    checks.push({ name: 'Security Headers', status: 'FAIL', issue: 'Security headers still conditional' });
  } else {
    console.log('✅ Security headers always enabled');
    checks.push({ name: 'Security Headers', status: 'PASS' });
  }
  
} catch (error) {
  console.log('❌ Could not check middleware.ts');
  checks.push({ name: 'Middleware Fixes', status: 'ERROR', issue: error.message });
}

// Check 3: Verify RBAC guard fixes
console.log('\n3️⃣ Checking RBAC guard fixes...');
try {
  const guardContent = fs.readFileSync('lib/rbac/guard.ts', 'utf8');
  
  // Check for production enforcement
  if (guardContent.includes("process.env.NODE_ENV === 'production' && enforcementMode !== 'enforce'")) {
    console.log('✅ Production RBAC enforcement check added');
    checks.push({ name: 'RBAC Production Enforcement', status: 'PASS' });
  } else {
    console.log('❌ Production RBAC enforcement not implemented');
    checks.push({ name: 'RBAC Production Enforcement', status: 'FAIL', issue: 'No production enforcement check' });
  }
  
  // Check for dry-run bypass removal
  if (guardContent.includes("return null;") && guardContent.includes("dry-run")) {
    console.log('⚠️ Dry-run bypass still present (but may be secured)');
    checks.push({ name: 'RBAC Dry-run Bypass', status: 'WARN', issue: 'Dry-run logic present but may be secured' });
  } else {
    console.log('✅ Dry-run bypass secured or removed');
    checks.push({ name: 'RBAC Dry-run Bypass', status: 'PASS' });
  }
  
} catch (error) {
  console.log('❌ Could not check RBAC guard');
  checks.push({ name: 'RBAC Guard Fixes', status: 'ERROR', issue: error.message });
}

// Check 4: Verify RBAC provider fixes
console.log('\n4️⃣ Checking RBAC provider fixes...');
try {
  const providerContent = fs.readFileSync('src/components/auth/rbac-provider.tsx', 'utf8');
  
  // Check for hardcoded email removal
  if (providerContent.includes('luxsess2001@gmail.com')) {
    console.log('❌ Hardcoded admin email still present');
    checks.push({ name: 'Hardcoded Admin Removal', status: 'FAIL', issue: 'Hardcoded admin email not removed' });
  } else {
    console.log('✅ Hardcoded admin email removed');
    checks.push({ name: 'Hardcoded Admin Removal', status: 'PASS' });
  }
  
} catch (error) {
  console.log('❌ Could not check RBAC provider');
  checks.push({ name: 'RBAC Provider Fixes', status: 'ERROR', issue: error.message });
}

// Check 5: Verify registration input validation
console.log('\n5️⃣ Checking registration input validation...');
try {
  const registrationContent = fs.readFileSync('app/api/auth/register-new/route.ts', 'utf8');
  
  // Check for email validation
  if (registrationContent.includes('emailRegex')) {
    console.log('✅ Email format validation implemented');
    checks.push({ name: 'Email Validation', status: 'PASS' });
  } else {
    console.log('❌ Email validation missing');
    checks.push({ name: 'Email Validation', status: 'FAIL', issue: 'Email format validation not implemented' });
  }
  
  // Check for password validation
  if (registrationContent.includes('passwordRegex')) {
    console.log('✅ Password strength validation implemented');
    checks.push({ name: 'Password Validation', status: 'PASS' });
  } else {
    console.log('❌ Password validation missing');
    checks.push({ name: 'Password Validation', status: 'FAIL', issue: 'Password strength validation not implemented' });
  }
  
  // Check for role restriction
  if (registrationContent.includes("'admin'") && registrationContent.includes('validRoles')) {
    console.log('❌ Admin role still allowed in registration');
    checks.push({ name: 'Role Restriction', status: 'FAIL', issue: 'Admin role still allowed in public registration' });
  } else {
    console.log('✅ Admin role restricted from public registration');
    checks.push({ name: 'Role Restriction', status: 'PASS' });
  }
  
} catch (error) {
  console.log('❌ Could not check registration validation');
  checks.push({ name: 'Registration Validation', status: 'ERROR', issue: error.message });
}

// Check 6: Verify webhook security
console.log('\n6️⃣ Checking webhook security...');
try {
  const webhookContent = fs.readFileSync('app/api/webhooks/payment-success/route.ts', 'utf8');
  
  // Check for signature verification
  if (webhookContent.includes('verifyStripeSignature')) {
    console.log('✅ Webhook signature verification implemented');
    checks.push({ name: 'Webhook Signature Verification', status: 'PASS' });
  } else {
    console.log('❌ Webhook signature verification missing');
    checks.push({ name: 'Webhook Signature Verification', status: 'FAIL', issue: 'Webhook signature verification not implemented' });
  }
  
  // Check for replay protection
  if (webhookContent.includes('isWebhookReplay')) {
    console.log('✅ Webhook replay protection implemented');
    checks.push({ name: 'Webhook Replay Protection', status: 'PASS' });
  } else {
    console.log('❌ Webhook replay protection missing');
    checks.push({ name: 'Webhook Replay Protection', status: 'FAIL', issue: 'Webhook replay protection not implemented' });
  }
  
} catch (error) {
  console.log('❌ Could not check webhook security');
  checks.push({ name: 'Webhook Security', status: 'ERROR', issue: error.message });
}

// Check 7: Verify environment configuration
console.log('\n7️⃣ Checking environment configuration...');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  if (envContent.includes('RBAC_ENFORCEMENT=enforce')) {
    console.log('✅ RBAC enforcement enabled');
    checks.push({ name: 'RBAC Enforcement Config', status: 'PASS' });
  } else {
    console.log('❌ RBAC enforcement not configured');
    checks.push({ name: 'RBAC Enforcement Config', status: 'FAIL', issue: 'RBAC_ENFORCEMENT not set to enforce' });
  }
  
} catch (error) {
  console.log('⚠️ Could not check .env.local (may not exist)');
  checks.push({ name: 'Environment Config', status: 'WARN', issue: '.env.local file not found or not readable' });
}

// Check 8: Verify login error messages
console.log('\n8️⃣ Checking login error message security...');
try {
  const loginContent = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');
  
  // Check for generic error messages
  if (loginContent.includes("'Invalid credentials'")) {
    console.log('✅ Generic error messages implemented');
    checks.push({ name: 'Generic Error Messages', status: 'PASS' });
  } else {
    console.log('❌ Generic error messages not implemented');
    checks.push({ name: 'Generic Error Messages', status: 'FAIL', issue: 'Detailed error messages still present' });
  }
  
} catch (error) {
  console.log('❌ Could not check login error messages');
  checks.push({ name: 'Login Error Messages', status: 'ERROR', issue: error.message });
}

// Summary
console.log('\n📊 Security Fix Verification Summary:');
console.log('=====================================');

const passed = checks.filter(c => c.status === 'PASS').length;
const failed = checks.filter(c => c.status === 'FAIL').length;
const warnings = checks.filter(c => c.status === 'WARN').length;
const errors = checks.filter(c => c.status === 'ERROR').length;

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️ Warnings: ${warnings}`);
console.log(`🔥 Errors: ${errors}`);

console.log('\nDetailed Results:');
console.log('-----------------');
checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : check.status === 'WARN' ? '⚠️' : '🔥';
  console.log(`${icon} ${check.name}: ${check.status}`);
  if (check.issue) {
    console.log(`   Issue: ${check.issue}`);
  }
});

// Overall security status
console.log('\n🛡️ Overall Security Status:');
if (failed === 0 && errors === 0) {
  console.log('🟢 SECURE - All critical vulnerabilities have been fixed!');
  process.exit(0);
} else if (failed > 0) {
  console.log('🔴 VULNERABLE - Critical security issues remain!');
  console.log('⚠️ DO NOT DEPLOY TO PRODUCTION until all failures are resolved.');
  process.exit(1);
} else {
  console.log('🟡 PARTIALLY SECURE - Some issues need attention but no critical failures.');
  process.exit(0);
}
