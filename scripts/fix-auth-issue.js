#!/usr/bin/env node

/**
 * Authentication Issue Fix Script
 * 
 * This script helps diagnose and fix common authentication issues:
 * 1. Environment variables
 * 2. Database setup
 * 3. Cookie configuration
 * 4. Session handling
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Authentication Issue Fix Script')
console.log('==================================')

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n1️⃣ Checking environment variables...')
  
  const envPath = path.join(process.cwd(), '.env')
  const envExamplePath = path.join(process.cwd(), '.env.example')
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found')
    
    if (fs.existsSync(envExamplePath)) {
      console.log('📋 Creating .env from .env.example...')
      try {
        fs.copyFileSync(envExamplePath, envPath)
        console.log('✅ .env file created from .env.example')
      } catch (error) {
        console.error('❌ Failed to create .env file:', error.message)
      }
    } else {
      console.log('⚠️ No .env.example found, creating basic .env...')
      const basicEnv = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3002

# Database Configuration
DATABASE_URL=your_database_url_here
`
      try {
        fs.writeFileSync(envPath, basicEnv)
        console.log('✅ Basic .env file created')
        console.log('⚠️ Please update the values in .env with your actual credentials')
      } catch (error) {
        console.error('❌ Failed to create .env file:', error.message)
      }
    }
  } else {
    console.log('✅ .env file exists')
    
    // Check if required variables are set
    const envContent = fs.readFileSync(envPath, 'utf8')
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    const missingVars = requiredVars.filter(varName => !envContent.includes(varName))
    
    if (missingVars.length > 0) {
      console.log('⚠️ Missing environment variables:', missingVars.join(', '))
      console.log('Please add these to your .env file')
    } else {
      console.log('✅ All required environment variables are present')
    }
  }
}

// Check database setup
function checkDatabaseSetup() {
  console.log('\n2️⃣ Checking database setup...')
  
  const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
  const scriptsPath = path.join(process.cwd(), 'scripts')
  
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ Database schema not found')
  } else {
    console.log('✅ Database schema exists')
  }
  
  if (!fs.existsSync(scriptsPath)) {
    console.log('❌ Scripts directory not found')
  } else {
    console.log('✅ Scripts directory exists')
    
    // Check for setup scripts
    const setupScripts = [
      'setup-auth-system.js',
      '001_create_promoters_table.sql',
      '002_alter_parties_add_type.sql'
    ]
    
    setupScripts.forEach(script => {
      const scriptPath = path.join(scriptsPath, script)
      if (fs.existsSync(scriptPath)) {
        console.log(`✅ ${script} exists`)
      } else {
        console.log(`⚠️ ${script} not found`)
      }
    })
  }
}

// Check authentication configuration
function checkAuthConfiguration() {
  console.log('\n3️⃣ Checking authentication configuration...')
  
  const authProviderPath = path.join(process.cwd(), 'src', 'components', 'auth', 'auth-provider.tsx')
  const middlewarePath = path.join(process.cwd(), 'middleware.ts')
  const supabaseClientPath = path.join(process.cwd(), 'lib', 'supabase', 'client.ts')
  
  const files = [
    { path: authProviderPath, name: 'Auth Provider' },
    { path: middlewarePath, name: 'Middleware' },
    { path: supabaseClientPath, name: 'Supabase Client' }
  ]
  
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      console.log(`✅ ${file.name} exists`)
    } else {
      console.log(`❌ ${file.name} not found`)
    }
  })
}

// Generate fix recommendations
function generateRecommendations() {
  console.log('\n4️⃣ Generating fix recommendations...')
  
  console.log('\n📋 Recommended Actions:')
  console.log('1. Ensure environment variables are set correctly in .env')
  console.log('2. Run database setup: node scripts/setup-auth-system.js')
  console.log('3. Check Supabase project configuration')
  console.log('4. Verify OAuth providers are enabled in Supabase')
  console.log('5. Test authentication flow: node test-auth-flow.js')
  console.log('6. Check browser console for specific errors')
  console.log('7. Use debug page: /en/debug-auth')
  
  console.log('\n🔧 Quick Fixes:')
  console.log('- Clear browser cookies and localStorage')
  console.log('- Restart the development server')
  console.log('- Check network tab for API errors')
  console.log('- Verify Supabase project is active')
}

// Main execution
async function main() {
  try {
    checkEnvironmentVariables()
    checkDatabaseSetup()
    checkAuthConfiguration()
    generateRecommendations()
    
    console.log('\n✅ Authentication issue diagnosis complete!')
    console.log('\nNext steps:')
    console.log('1. Update .env with your Supabase credentials')
    console.log('2. Run: node scripts/setup-auth-system.js')
    console.log('3. Start the development server: npm run dev')
    console.log('4. Test authentication: node test-auth-flow.js')
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  checkEnvironmentVariables,
  checkDatabaseSetup,
  checkAuthConfiguration,
  generateRecommendations
} 