const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkAndCreateAdmin() {
  console.log('=== Check and Create Admin User ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔗 Supabase URL:', supabaseUrl)
  console.log('🔑 Service key starts with:', supabaseServiceKey?.substring(0, 20) + '...')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // First, let's check if we can access the database
    console.log('\n1. Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Check current users
    console.log('\n2. Checking current users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('❌ Error checking users:', usersError.message)
      return
    }
    
    console.log('📋 Current users:', users?.length || 0)
    
    // Check if admin user exists
    const adminUser = users?.find(u => u.email === 'luxsess2001@gmail.com')
    
    if (adminUser) {
      console.log('✅ Admin user already exists:', adminUser)
    } else {
      console.log('\n3. Creating admin user...')
      
      // Try to create admin user
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
        
        // If RLS is blocking, let's try a different approach
        console.log('\n4. Trying to create admin user via SQL...')
        try {
          // Use a simple SQL query to create the user
          const { data: sqlResult, error: sqlError } = await supabase
            .rpc('exec_sql', {
              sql: `
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
              `
            })
          
          if (sqlError) {
            console.error('❌ SQL creation failed:', sqlError.message)
          } else {
            console.log('✅ Admin user created via SQL')
          }
        } catch (rpcError) {
          console.error('❌ RPC call failed:', rpcError.message)
        }
      } else {
        console.log('✅ Admin user created:', newUser)
      }
    }
    
    // Check profiles table
    console.log('\n5. Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError.message)
    } else {
      console.log('📋 Current profiles:', profiles?.length || 0)
      
      const adminProfile = profiles?.find(p => p.email === 'luxsess2001@gmail.com')
      
      if (adminProfile) {
        console.log('✅ Admin profile already exists:', adminProfile)
      } else {
        console.log('\n6. Creating admin profile...')
        
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
    console.log('\n7. Final verification...')
    const { data: finalUsers } = await supabase.from('users').select('*')
    const { data: finalProfiles } = await supabase.from('profiles').select('*')
    
    console.log('📊 Final users count:', finalUsers?.length || 0)
    console.log('📊 Final profiles count:', finalProfiles?.length || 0)
    
    const finalAdminUser = finalUsers?.find(u => u.email === 'luxsess2001@gmail.com')
    const finalAdminProfile = finalProfiles?.find(p => p.email === 'luxsess2001@gmail.com')
    
    console.log('✅ Admin user exists:', finalAdminUser ? 'Yes' : 'No')
    console.log('✅ Admin profile exists:', finalAdminProfile ? 'Yes' : 'No')
    
    if (finalAdminUser) {
      console.log('📋 Admin user details:', finalAdminUser)
    }
    if (finalAdminProfile) {
      console.log('📋 Admin profile details:', finalAdminProfile)
    }
    
    console.log('\n=== Check and Create Complete ===')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

checkAndCreateAdmin().catch(console.error) 