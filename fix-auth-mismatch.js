const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixAuthenticationMismatch() {
  console.log('=== Authentication Mismatch Fix ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    console.log('\n1. Creating auth user for admin...')
    
    // Create the admin user in auth.users table
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'luxsess2001@gmail.com',
      password: 'TempPassword123!', // You should change this immediately
      email_confirm: true,
      user_metadata: {
        full_name: 'Fahad alamri',
        role: 'admin'
      }
    })
    
    if (authError) {
      console.log('⚠️ Auth user creation result:', authError.message)
      
      // If user already exists, try to get the existing user
      if (authError.message.includes('already registered')) {
        console.log('✅ Admin user already exists in auth, checking details...')
        
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const adminAuthUser = existingUsers.users.find(u => u.email === 'luxsess2001@gmail.com')
        
        if (adminAuthUser) {
          console.log('✅ Found existing admin auth user:', {
            id: adminAuthUser.id,
            email: adminAuthUser.email,
            created_at: adminAuthUser.created_at
          })
          
          // Update the profiles table to match the auth user ID
          const { data: updateResult, error: updateError } = await supabase
            .from('profiles')
            .update({ id: adminAuthUser.id })  
            .eq('email', 'luxsess2001@gmail.com')
          
          if (updateError) {
            console.log('⚠️ Profile update error:', updateError.message)
          } else {
            console.log('✅ Profile updated to match auth user ID')
          }
        }
      }
    } else {
      console.log('✅ New auth user created:', {
        id: authUser.user.id,
        email: authUser.user.email
      })
      
      // Update the profiles table to use the new auth user ID
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          id: authUser.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'luxsess2001@gmail.com')
      
      if (profileUpdateError) {
        console.log('⚠️ Profile update error:', profileUpdateError.message)
      } else {
        console.log('✅ Profile updated with new auth user ID')
      }
    }
    
    console.log('\n2. Verifying authentication setup...')
    
    // Check if everything is now aligned
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers()
    const adminAuth = finalAuthUsers.users.find(u => u.email === 'luxsess2001@gmail.com')
    
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    console.log('\n📊 Final Status:')
    console.log('Auth User:', adminAuth ? { id: adminAuth.id, email: adminAuth.email } : 'Not found')
    console.log('Profile:', adminProfile ? { id: adminProfile.id, email: adminProfile.email, role: adminProfile.role } : 'Not found')
    
    if (adminAuth && adminProfile && adminAuth.id === adminProfile.id) {
      console.log('\n✅ SUCCESS: Authentication alignment completed!')
      console.log('🔑 Admin user can now log in with:')
      console.log('   Email: luxsess2001@gmail.com')
      console.log('   Password: TempPassword123! (change this immediately!)')
    } else {
      console.log('\n⚠️ WARNING: IDs still don\'t match - manual intervention required')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixAuthenticationMismatch().catch(console.error)
