#!/usr/bin/env node

/**
 * Security Fixes Verification Script
 * 
 * This script performs basic verification that the security fixes are in place.
 * Run: node scripts/verify-security-fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Security Fixes Verification\n');

const checks = [
  {
    name: 'otplib dependency installed',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.dependencies.otplib !== undefined;
    }
  },
  {
    name: 'MFA service imports otplib',
    check: () => {
      const content = fs.readFileSync('lib/auth/mfa-service.ts', 'utf8');
      return content.includes("import { authenticator } from 'otplib'");
    }
  },
  {
    name: 'MFA service uses authenticator.verify',
    check: () => {
      const content = fs.readFileSync('lib/auth/mfa-service.ts', 'utf8');
      return content.includes('authenticator.verify({ token, secret })');
    }
  },
  {
    name: 'MFA service uses secure secret generation',
    check: () => {
      const content = fs.readFileSync('lib/auth/mfa-service.ts', 'utf8');
      return content.includes('authenticator.generateSecret()');
    }
  },
  {
    name: 'MFA backup codes use crypto API',
    check: () => {
      const content = fs.readFileSync('lib/auth/mfa-service.ts', 'utf8');
      return content.includes('crypto.randomBytes') || content.includes('crypto.getRandomValues');
    }
  },
  {
    name: 'Production auth service uses lazy client creation',
    check: () => {
      const content = fs.readFileSync('lib/auth/production-auth-service.ts', 'utf8');
      return content.includes('private async getSupabaseClient()');
    }
  },
  {
    name: 'Production auth signIn awaits client',
    check: () => {
      const content = fs.readFileSync('lib/auth/production-auth-service.ts', 'utf8');
      return content.includes('const supabase = await this.getSupabaseClient()');
    }
  },
  {
    name: 'Bookings API uses authenticated client',
    check: () => {
      const content = fs.readFileSync('app/api/bookings/upsert/route.ts', 'utf8');
      return content.includes("import { createClient } from '@/lib/supabase/server'");
    }
  },
  {
    name: 'Bookings API verifies session',
    check: () => {
      const content = fs.readFileSync('app/api/bookings/upsert/route.ts', 'utf8');
      return content.includes('await supabase.auth.getSession()');
    }
  },
  {
    name: 'Bookings API checks authentication',
    check: () => {
      const content = fs.readFileSync('app/api/bookings/upsert/route.ts', 'utf8');
      return content.includes('Unauthorized') && content.includes('Authentication required');
    }
  },
  {
    name: 'Webhook API awaits createClient',
    check: () => {
      const content = fs.readFileSync('app/api/webhooks/[type]/route.ts', 'utf8');
      return content.includes('const supabase = await createClient()');
    }
  },
  {
    name: 'Registration page removes admin role type',
    check: () => {
      const content = fs.readFileSync('app/[locale]/register-new/page.tsx', 'utf8');
      const typeDefinition = content.match(/type UserRole = ['"].*['"];/);
      return typeDefinition && !typeDefinition[0].includes('admin');
    }
  },
  {
    name: 'Registration page validates roles server-side',
    check: () => {
      const content = fs.readFileSync('app/[locale]/register-new/page.tsx', 'utf8');
      return content.includes('allowedRoles') && content.includes("['provider', 'client', 'user']");
    }
  },
  {
    name: 'Registration sets status to pending',
    check: () => {
      const content = fs.readFileSync('app/[locale]/register-new/page.tsx', 'utf8');
      return content.includes("status: 'pending'");
    }
  },
  {
    name: 'Registration removes admin API call',
    check: () => {
      const content = fs.readFileSync('app/[locale]/register-new/page.tsx', 'utf8');
      return !content.includes('supabase.auth.admin.updateUserById');
    }
  },
  {
    name: 'Registration UI removes admin option',
    check: () => {
      const content = fs.readFileSync('app/[locale]/register-new/page.tsx', 'utf8');
      const adminSelectItem = content.includes("<SelectItem value='admin'>");
      return !adminSelectItem;
    }
  }
];

let passed = 0;
let failed = 0;

checks.forEach((check, index) => {
  try {
    const result = check.check();
    if (result) {
      console.log(`✅ ${index + 1}. ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${index + 1}. ${check.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${check.name} (Error: ${error.message})`);
    failed++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Total Checks: ${checks.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log(`${'='.repeat(50)}\n`);

if (failed === 0) {
  console.log('🎉 All security fixes verified successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run test');
  console.log('3. Run: npm run lint');
  console.log('4. Deploy to staging for testing');
  process.exit(0);
} else {
  console.log('⚠️  Some security fixes may not be properly applied.');
  console.log('Please review the failed checks and ensure all fixes are in place.');
  process.exit(1);
}
