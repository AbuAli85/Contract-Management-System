const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createTestUser() {
  console.log('=== Creating Test User ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Please make sure your .env.local file contains:')
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test email and password
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    console.log(`📧 Creating user with email: ${testEmail}`)
    
    // Create user with admin privileges
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Test User',
        role: 'admin'
      }
    })
    
    if (error) {
      console.error('❌ Error creating user:', error.message)
      
      // Check if user already exists
      if (error.message.includes('User already registered')) {
        console.log('ℹ️ User already exists, attempting to reset password...')
        
        const { error: resetError } = await supabase.auth.admin.updateUserById(
          user?.id || 'unknown',
          { password: testPassword }
        )
        
        if (resetError) {
          console.error('❌ Error resetting password:', resetError.message)
        } else {
          console.log('✅ Password reset successfully')
        }
      }
    } else {
      console.log('✅ Test user created successfully')
      console.log(`📧 Email: ${testEmail}`)
      console.log(`🔑 Password: ${testPassword}`)
    }
    
    // List existing users
    console.log('\n=== Existing Users ===')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
    } else {
      users.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.created_at})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

createTestUser().catch(console.error)
