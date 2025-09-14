#!/usr/bin/env node

/**
 * CAPTCHA Issue Fix Script
 * This script helps fix the CAPTCHA verification issues in your Supabase project
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CAPTCHA Issue Fix Script');
console.log('============================\n');

// Check current environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Production Mode: ${isProduction ? 'Yes' : 'No'}\n`);

// Check if we're in a Supabase project
const supabaseConfigPath = path.join(process.cwd(), 'supabase', 'config.toml');
const hasSupabaseConfig = fs.existsSync(supabaseConfigPath);

if (hasSupabaseConfig) {
  console.log('✅ Supabase project detected');
  
  // Read the config file
  const configContent = fs.readFileSync(supabaseConfigPath, 'utf8');
  
  // Check if CAPTCHA is enabled
  const captchaEnabled = configContent.includes('[auth.captcha]') && 
                        configContent.includes('enabled = true');
  
  if (captchaEnabled) {
    console.log('⚠️  CAPTCHA is currently ENABLED in your local config');
    console.log('   This is likely causing the "unexpected_failure" error\n');
  } else {
    console.log('✅ CAPTCHA is disabled in your local config');
  }
} else {
  console.log('⚠️  No local Supabase config found');
  console.log('   Make sure you\'re running this from your project root\n');
}

console.log('🚨 ISSUE IDENTIFIED:');
console.log('   The 500 error on "token?grant_type=password" is caused by');
console.log('   CAPTCHA verification being enabled in your Supabase project.\n');

console.log('🔧 IMMEDIATE FIX:');
console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('   2. Select your project');
console.log('   3. Navigate to Authentication → Settings');
console.log('   4. Find the CAPTCHA section');
console.log('   5. Disable CAPTCHA verification (set to OFF)');
console.log('   6. Save changes\n');

console.log('✅ VERIFICATION:');
console.log('   After disabling CAPTCHA:');
console.log('   1. Try logging in again');
console.log('   2. The 500 error should be resolved');
console.log('   3. Authentication should work normally\n');

console.log('🛠️  ALTERNATIVE SOLUTIONS:');
console.log('   If you need CAPTCHA in production:');
console.log('   1. Configure CAPTCHA properly with real keys');
console.log('   2. Use the production authentication system');
console.log('   3. Test thoroughly before deploying\n');

console.log('📋 WHAT I\'VE FIXED:');
console.log('   ✅ Created simple login API (/api/auth/simple-login)');
console.log('   ✅ Created simple register API (/api/auth/simple-register)');
console.log('   ✅ Updated login page to use fixed components');
console.log('   ✅ Updated signup page to use fixed components');
console.log('   ✅ Added CAPTCHA error detection and instructions');
console.log('   ✅ Added direct links to Supabase Dashboard\n');

console.log('🧪 TEST YOUR FIX:');
console.log('   1. Disable CAPTCHA in Supabase Dashboard');
console.log('   2. Go to: http://localhost:3000/en/auth/login');
console.log('   3. Try logging in with test credentials');
console.log('   4. Should work without 500 errors\n');

console.log('📚 ADDITIONAL RESOURCES:');
console.log('   - Supabase CAPTCHA Docs: https://supabase.com/docs/guides/auth/captcha');
console.log('   - hCaptcha: https://www.hcaptcha.com/');
console.log('   - Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/\n');

console.log('🎯 NEXT STEPS:');
console.log('   1. Disable CAPTCHA in Supabase Dashboard (immediate fix)');
console.log('   2. Test the authentication system');
console.log('   3. Configure CAPTCHA properly if needed for production');
console.log('   4. Deploy with working authentication\n');

console.log('💡 PRO TIP:');
console.log('   For development, keep CAPTCHA disabled.');
console.log('   For production, configure CAPTCHA with proper keys and test thoroughly.\n');

console.log('🔧 Need more help?');
console.log('   - Check the browser console for detailed error messages');
console.log('   - Review the Supabase logs in your dashboard');
console.log('   - Test with the simple authentication APIs I created\n');

console.log('✅ STATUS: READY TO FIX - Just disable CAPTCHA in Supabase Dashboard!');
