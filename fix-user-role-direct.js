const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixUserRoleDirect() {
  console.log('=== Fixing User Role Directly ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    process.exit(1)
  }
  
  console.log('🔗 Connecting to:', supabaseUrl)
  console.log('🔑 Service key length:', supabaseServiceKey?.length || 0)
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const targetEmail = 'luxsess2001@gmail.com'
    const targetUserId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170'
    
    // 1. Check current state in both tables
    console.log('\n1. Checking current state...')
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', targetEmail)
    
    console.log('Users table:', usersData)
    console.log('Profiles table:', profilesData)
    
    // 2. Fix users table
    console.log('\n2. Updating users table...')
    const { data: updatedUser, error: updateUserError } = await supabase
      .from('users')
      .upsert({
        id: targetUserId,
        email: targetEmail,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (updateUserError) {
      console.error('❌ Users table update failed:', updateUserError.message)
    } else {
      console.log('✅ Users table updated:', updatedUser)
    }
    
    // 3. Fix profiles table
    console.log('\n3. Updating profiles table...')
    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: targetUserId,
        email: targetEmail,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (updateProfileError) {
      console.error('❌ Profiles table update failed:', updateProfileError.message)
    } else {
      console.log('✅ Profiles table updated:', updatedProfile)
    }
    
    // 4. Update auth user metadata
    console.log('\n4. Updating auth user metadata...')
    const { data: authUpdate, error: authUpdateError } = await supabase.auth.admin.updateUserById(
      targetUserId,
      {
        user_metadata: {
          role: 'admin',
          full_name: 'Fahad alamri'
        }
      }
    )
    
    if (authUpdateError) {
      console.error('❌ Auth metadata update failed:', authUpdateError.message)
    } else {
      console.log('✅ Auth metadata updated:', authUpdate)
    }
    
    // 5. Final verification
    console.log('\n5. Final verification...')
    const { data: finalUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single()
    
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', targetEmail)
      .single()
    
    console.log('Final user record:', finalUser)
    console.log('Final profile record:', finalProfile)
    
    console.log('\n=== Role Fix Complete ===')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

if (require.main === module) {
  fixUserRoleDirect()
}

module.exports = { fixUserRoleDirect }
