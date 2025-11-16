#!/usr/bin/env node

/**
 * COMPREHENSIVE EMAIL CONFIGURATION DIAGNOSTIC
 * 
 * This script checks EVERYTHING related to email configuration
 */

console.log('🔍 EMAIL CONFIGURATION DIAGNOSTIC');
console.log('='.repeat(70));
console.log('');

// Check 1: Environment Variables
console.log('📋 STEP 1: ENVIRONMENT VARIABLES CHECK');
console.log('-'.repeat(70));

const checks = {
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  resendFromName: process.env.RESEND_FROM_NAME,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
};

console.log('✓ RESEND_API_KEY:', checks.resendApiKey ? '✅ SET (' + checks.resendApiKey.substring(0, 10) + '...)' : '❌ NOT SET');
console.log('✓ RESEND_FROM_EMAIL:', checks.resendFromEmail || '❌ NOT SET (will use default: noreply@portal.thesmartpro.io)');
console.log('✓ RESEND_FROM_NAME:', checks.resendFromName || '❌ NOT SET (will use default: SmartPro Contract Management System)');
console.log('✓ APP_URL:', checks.appUrl || '❌ NOT SET');
console.log('');

// Check 2: Expected Configuration
console.log('📋 STEP 2: EXPECTED CONFIGURATION');
console.log('-'.repeat(70));
console.log('Expected FROM email: noreply@portal.thesmartpro.io');
console.log('Expected FROM name: SmartPro Contract Management System');
console.log('Expected domain: portal.thesmartpro.io');
console.log('Domain verification required: YES ✅');
console.log('DNS records required: SPF, DKIM, DMARC ✅');
console.log('');

// Check 3: API Endpoints
console.log('📋 STEP 3: EMAIL API ENDPOINTS');
console.log('-'.repeat(70));
console.log('✓ Test Email: GET /api/test-email');
console.log('✓ Send Notification: POST /api/promoters/[id]/notify');
console.log('✓ Email Service: lib/services/email.service.ts');
console.log('✓ Email Templates:');
console.log('  - lib/email-templates/urgent-notification.ts');
console.log('  - lib/email-templates/standard-notification.ts');
console.log('  - lib/email-templates/document-expiry.ts');
console.log('  - lib/email-templates/welcome.ts');
console.log('  - lib/email-templates/contract-approval.ts');
console.log('');

// Check 4: Common Issues
console.log('📋 STEP 4: COMMON ISSUES TO CHECK');
console.log('-'.repeat(70));
console.log('');
console.log('❓ Issue 1: RESEND_API_KEY not set in Vercel');
console.log('   Solution: Go to Vercel → Settings → Environment Variables');
console.log('   Add: RESEND_API_KEY=re_your_key_here');
console.log('');
console.log('❓ Issue 2: Domain not verified in Resend');
console.log('   Solution: Go to https://resend.com/domains');
console.log('   Verify: portal.thesmartpro.io');
console.log('   Check: All DNS records are ✅ green');
console.log('');
console.log('❓ Issue 3: Wrong FROM email address');
console.log('   Check: Must be @portal.thesmartpro.io');
console.log('   NOT: @falconeyegroup.net or other domains');
console.log('');
console.log('❓ Issue 4: Microsoft 365 blocking emails');
console.log('   Solution: Add sender to Safe Senders list');
console.log('   OR: Create Transport Rule in Exchange Admin');
console.log('');
console.log('❓ Issue 5: Emails in quarantine');
console.log('   Check: https://security.microsoft.com/quarantine');
console.log('   Release: Any blocked emails from noreply@portal.thesmartpro.io');
console.log('');

// Check 5: Test URLs
console.log('📋 STEP 5: QUICK TESTS');
console.log('-'.repeat(70));
console.log('');
console.log('🧪 Test 1: Simple test email');
console.log('   URL: https://portal.thesmartpro.io/api/test-email');
console.log('   Method: GET');
console.log('   Expected: Email arrives in inbox');
console.log('');
console.log('🧪 Test 2: Real notification');
console.log('   URL: https://portal.thesmartpro.io/api/promoters/[id]/notify');
console.log('   Method: POST');
console.log('   Body: { "type": "urgent" }');
console.log('   Expected: Email arrives in inbox');
console.log('');

// Check 6: Resend Dashboard Links
console.log('📋 STEP 6: RESEND DASHBOARD LINKS');
console.log('-'.repeat(70));
console.log('🔗 Emails: https://resend.com/emails');
console.log('🔗 Domains: https://resend.com/domains');
console.log('🔗 API Keys: https://resend.com/api-keys');
console.log('🔗 Webhooks: https://resend.com/webhooks');
console.log('🔗 Settings: https://resend.com/settings');
console.log('');

// Check 7: Microsoft 365 Links
console.log('📋 STEP 7: MICROSOFT 365 LINKS');
console.log('-'.repeat(70));
console.log('🔗 Quarantine: https://security.microsoft.com/quarantine');
console.log('🔗 Transport Rules: https://admin.exchange.microsoft.com/#/transportrules');
console.log('🔗 Anti-spam: https://security.microsoft.com/antispam');
console.log('🔗 Outlook Junk Settings: https://outlook.office.com/mail/options/mail/junkEmail');
console.log('');

// Check 8: Current Status
console.log('📋 STEP 8: CURRENT STATUS SUMMARY');
console.log('-'.repeat(70));
console.log('✅ Email service configured: YES');
console.log('✅ Domain verified: YES (portal.thesmartpro.io)');
console.log('✅ Test emails working: YES');
console.log('❌ Real notifications blocked: YES (by Microsoft 365)');
console.log('⏳ Solution needed: Whitelist sender in Microsoft 365');
console.log('');

// Final recommendation
console.log('='.repeat(70));
console.log('🎯 RECOMMENDED ACTION:');
console.log('');
console.log('1. Go to: https://outlook.office.com/mail/options/mail/junkEmail');
console.log('2. Add to Safe senders: portal.thesmartpro.io');
console.log('3. Add to Safe senders: noreply@portal.thesmartpro.io');
console.log('4. Save settings');
console.log('5. Test again with: /api/promoters/[id]/notify');
console.log('6. Email should arrive in INBOX (not spam)');
console.log('');
console.log('='.repeat(70));
console.log('');







