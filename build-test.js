// Build Test Script
// Run this to test the build process

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🔨 Testing Build Process')
console.log('========================')

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found. Make sure you\'re in the project root directory.')
    process.exit(1)
  }

  console.log('✅ Found package.json')
  
  // Check if .env.local exists
  if (fs.existsSync('.env.local')) {
    console.log('✅ Found .env.local')
  } else {
    console.log('⚠️  .env.local not found - make sure environment variables are set')
  }

  // Check if node_modules exists
  if (fs.existsSync('node_modules')) {
    console.log('✅ Found node_modules')
  } else {
    console.log('⚠️  node_modules not found - run "pnpm install" first')
  }

  console.log('\n🚀 Starting build process...')
  
  // Run the build
  const result = execSync('pnpm build', { 
    encoding: 'utf8',
    stdio: 'pipe'
  })
  
  console.log('✅ Build completed successfully!')
  console.log('\n📋 Build Summary:')
  console.log(result)
  
} catch (error) {
  console.error('❌ Build failed:')
  console.error(error.message)
  
  if (error.stdout) {
    console.log('\n📋 Build output:')
    console.log(error.stdout)
  }
  
  if (error.stderr) {
    console.log('\n❌ Build errors:')
    console.log(error.stderr)
  }
  
  process.exit(1)
} 