/*
  Assign a test role to a user. Run with: node scripts/assign-test-role.js
  This helps test the RBAC system by giving a user actual permissions.
*/
require('dotenv/config')
const { createClient } = require('@supabase/supabase-js')

async function assignTestRole() {
  console.log('🔐 Assigning Test Role...')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }
  
  const supabase = createClient(url, serviceKey, { 
    auth: { autoRefreshToken: false, persistSession: false } 
  })
  
  try {
    // Get the first user from profiles table
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)
    
    if (userError || !users || users.length === 0) {
      console.error('❌ No users found in profiles table')
      return false
    }
    
    const user = users[0]
    console.log(`👤 Found user: ${user.email} (ID: ${user.id})`)
    
    // Get the "Basic Client" role
    const { data: roles, error: roleError } = await supabase
      .from('rbac_roles')
      .select('id, name')
      .eq('name', 'Basic Client')
      .limit(1)
    
    if (roleError || !roles || roles.length === 0) {
      console.error('❌ Basic Client role not found')
      return false
    }
    
    const role = roles[0]
    console.log(`🎭 Found role: ${role.name} (ID: ${role.id})`)
    
    // Check if assignment already exists
    const { data: existing, error: checkError } = await supabase
      .from('rbac_user_role_assignments')
      .select('id')
      .eq('user_id', user.id)
      .eq('role_id', role.id)
      .limit(1)
    
    if (checkError) {
      console.error('❌ Error checking existing assignment:', checkError.message)
      return false
    }
    
    if (existing && existing.length > 0) {
      console.log('✅ Role already assigned to user')
      return true
    }
    
    // Assign the role
    const { data: assignment, error: assignError } = await supabase
      .from('rbac_user_role_assignments')
      .insert({
        user_id: user.id,
        role_id: role.id,
        assigned_by: user.id, // Self-assigned for testing
        context: { source: 'test-script' },
        is_active: true
      })
      .select()
    
    if (assignError) {
      console.error('❌ Error assigning role:', assignError.message)
      return false
    }
    
    console.log('✅ Successfully assigned Basic Client role to user')
    
    // Refresh the materialized view
    await supabase.rpc('rbac_refresh_user_permissions_mv')
    console.log('✅ Refreshed materialized view')
    
    return true
    
  } catch (error) {
    console.error('❌ Assignment failed:', error.message)
    return false
  }
}

assignTestRole().then(success => {
  if (success) {
    console.log('🎉 Test role assignment complete!')
    console.log('💡 You can now test the RBAC system with this user')
  } else {
    console.log('❌ Test role assignment failed')
  }
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})

