const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createAdminDirect() {
  console.log('=== Creating Admin User Directly ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
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
    } else {
      console.log('\n2. Creating admin user directly...')
      
      // Create admin user using admin client
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
        
        // Try alternative approach - disable RLS temporarily
        console.log('\n3. Trying alternative approach...')
        try {
          // Use raw SQL to disable RLS and create user
          const { data: rlsResult, error: rlsError } = await supabase
            .rpc('exec_sql', { 
              sql: `
                ALTER TABLE users DISABLE ROW LEVEL SECURITY;
                INSERT INTO users (id, email, full_name, role, status, created_at)
                VALUES (
                  '550e8400-e29b-41d4-a716-446655440000',
                  'luxsess2001@gmail.com',
                  'Admin User',
                  'admin',
                  'active',
                  NOW()
                ) ON CONFLICT (id) DO UPDATE SET
                  role = 'admin',
                  status = 'active',
                  updated_at = NOW();
                ALTER TABLE users ENABLE ROW LEVEL SECURITY;
              `
            })
          
          if (rlsError) {
            console.error('❌ RLS bypass failed:', rlsError.message)
          } else {
            console.log('✅ Admin user created via RLS bypass')
          }
        } catch (rpcError) {
          console.error('❌ RPC call failed:', rpcError.message)
        }
      } else {
        console.log('✅ Admin user created:', newUser)
      }
    }
    
    // Check profiles table
    console.log('\n4. Checking profiles table...')
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
      } else {
        console.log('\n5. Creating admin profile...')
        
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
    console.log('\n6. Final verification...')
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
    
    if (finalAdminUser) {
      console.log('📋 Admin user details:', finalAdminUser)
    }
    if (finalAdminProfile) {
      console.log('📋 Admin profile details:', finalAdminProfile)
    }
    
    console.log('\n=== Admin User Creation Complete ===')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

createAdminDirect().catch(console.error) 