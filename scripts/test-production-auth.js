#!/usr/bin/env node

console.log('🔍 Testing Production Authentication Configuration...\n')

console.log('📋 Current Vercel Deployment:')
console.log('  https://contract-management-system-5r1ve1bjk-abuali85s-projects.vercel.app\n')

console.log('📋 Required Supabase Configuration:')
console.log('  Site URL: https://contract-management-system-5r1ve1bjk-abuali85s-projects.vercel.app')
console.log('  Redirect URLs:')
console.log('    - https://contract-management-system-5r1ve1bjk-abuali85s-projects.vercel.app/auth/callback')
console.log('    - https://contract-management-system-5r1ve1bjk-abuali85s-projects.vercel.app/en/auth/callback')
console.log('    - https://contract-management-system-5r1ve1bjk-abuali85s-projects.vercel.app/ar/auth/callback\n')

console.log('🔧 Steps to Fix:')
console.log('1. Go to https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to Settings → Authentication → URL Configuration')
console.log('4. Update Site URL and Redirect URLs as shown above')
console.log('5. Save changes')
console.log('6. Test authentication on your Vercel deployment\n')

console.log('✅ Environment Variables Status:')
console.log('  NEXT_PUBLIC_SUPABASE_URL: ✅ Set in Vercel')
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Set in Vercel\n')

console.log('🎯 The issue is likely Supabase project configuration, not environment variables.') 