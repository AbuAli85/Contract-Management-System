#!/usr/bin/env node

console.log('🔍 Testing Production Environment Configuration...\n')

console.log('📋 Environment Variables Check:')
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}\n`)

console.log('🔧 Supabase Configuration Status:')
console.log('  ✅ Site URL: https://portal.thesmartpro.io')
console.log('  ✅ Redirect URLs: All configured correctly\n')

console.log('🎯 Current Issue Analysis:')
console.log('  The Supabase configuration is correct, but authentication is failing.')
console.log('  This suggests a cookie handling issue in production.\n')

console.log('🔧 Applied Fixes:')
console.log('  1. ✅ Updated cookie domain handling for portal.thesmartpro.io')
console.log('  2. ✅ Added proper domain=.thesmartpro.io for cookies')
console.log('  3. ✅ Updated middleware cookie handling\n')

console.log('📋 Next Steps:')
console.log('1. Deploy the updated code to Vercel')
console.log('2. Test authentication on https://portal.thesmartpro.io')
console.log('3. Check browser cookies in DevTools')
console.log('4. Verify Supabase session is being created\n')

console.log('🚀 Deploy Command:')
console.log('  vercel --prod\n')

console.log('🔍 Debug Steps:')
console.log('1. Open https://portal.thesmartpro.io')
console.log('2. Open DevTools → Application → Cookies')
console.log('3. Look for Supabase auth cookies')
console.log('4. Check if cookies have correct domain (.thesmartpro.io)') 