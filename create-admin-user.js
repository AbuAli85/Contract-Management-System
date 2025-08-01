const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createAdminUser() {
  console.log('=== Creating Admin User ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Check current state
    console.log('\n1. Checking current state...')
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, status')
    
    if (usersError) {
      console.error('❌ Error checking users:', usersError.message)
      return
    }
    
    console.log('📋 Current users:', existingUsers?.length || 0)
    if (existingUsers && existingUsers.length > 0) {
      existingUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`)
      })
    }
    
    // Check if admin user already exists
    const adminUser = existingUsers?.find(u => u.email === 'luxsess2001@gmail.com')
    
    if (adminUser) {
      console.log('\n✅ Admin user already exists:', adminUser)
      
      // Update admin user to ensure correct role
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin', 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('email', 'luxsess2001@gmail.com')
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Error updating admin user:', updateError.message)
      } else {
        console.log('✅ Admin user updated:', updatedUser)
      }
    } else {
      console.log('\n2. Creating admin user...')
      
      // Create admin user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'luxsess2001@gmail.com',
          full_name: 'Admin User',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating admin user:', createError.message)
        return
      }
      
      console.log('✅ Admin user created:', newUser)
    }
    
    // Check profiles table
    console.log('\n3. Checking profiles table...')
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, status')
    
    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError.message)
    } else {
      console.log('📋 Current profiles:', existingProfiles?.length || 0)
      
      // Check if admin profile exists
      const adminProfile = existingProfiles?.find(p => p.email === 'luxsess2001@gmail.com')
      
      if (adminProfile) {
        console.log('✅ Admin profile already exists:', adminProfile)
        
        // Update admin profile
        const { data: updatedProfile, error: updateProfileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin', 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'luxsess2001@gmail.com')
          .select()
          .single()
        
        if (updateProfileError) {
          console.error('❌ Error updating admin profile:', updateProfileError.message)
        } else {
          console.log('✅ Admin profile updated:', updatedProfile)
        }
      } else {
        console.log('\n4. Creating admin profile...')
        
        // Create admin profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'luxsess2001@gmail.com',
            full_name: 'Admin User',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (createProfileError) {
          console.error('❌ Error creating admin profile:', createProfileError.message)
        } else {
          console.log('✅ Admin profile created:', newProfile)
        }
      }
    }
    
    // Final verification
    console.log('\n5. Final verification...')
    const { data: finalUsers, error: finalUsersError } = await supabase
      .from('users')
      .select('id, email, role, status')
    
    const { data: finalProfiles, error: finalProfilesError } = await supabase
      .from('profiles')
      .select('id, email, role, status')
    
    console.log('📊 Final users count:', finalUsers?.length || 0)
    console.log('📊 Final profiles count:', finalProfiles?.length || 0)
    
    const finalAdminUser = finalUsers?.find(u => u.email === 'luxsess2001@gmail.com')
    const finalAdminProfile = finalProfiles?.find(p => p.email === 'luxsess2001@gmail.com')
    
    console.log('✅ Admin user in users table:', finalAdminUser ? 'Found' : 'Not found')
    console.log('✅ Admin profile in profiles table:', finalAdminProfile ? 'Found' : 'Not found')
    
    console.log('\n=== Admin User Creation Complete ===')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

createAdminUser().catch(console.error) 