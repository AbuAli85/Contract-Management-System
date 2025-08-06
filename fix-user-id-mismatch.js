const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUserIdMismatch() {
  const correctUserId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170'
  const wrongUserId = '550e8400-e29b-41d4-a716-446655440000'
  const email = 'luxsess2001@gmail.com'
  
  console.log('🔧 Fixing User ID Mismatch...\n')
  console.log('Correct ID (from auth):', correctUserId)
  console.log('Wrong ID (in users table):', wrongUserId)
  console.log('-------------------------------------------\n')
  
  try {
    // 1. First, check for any data dependencies
    console.log('1️⃣ Checking for data dependencies...')
    
    // Check contracts table
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id')
      .eq('user_id', wrongUserId)
    
    if (contractsError) {
      console.log('   ⚠️  Could not check contracts:', contractsError.message)
    } else {
      console.log('   📄 Contracts with wrong ID:', contracts?.length || 0)
    }

    // Check any other related tables
    // Add more checks as needed based on your schema

    // 2. Delete the incorrect user record
    console.log('\n2️⃣ Deleting incorrect user record...')
    
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', wrongUserId)
    
    if (deleteError) {
      console.error('❌ Error deleting incorrect user:', deleteError)
      return
    }
    
    console.log('✅ Deleted incorrect user record')

    // 3. Create new user record with correct ID
    console.log('\n3️⃣ Creating user record with correct ID...')
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: correctUserId,
          email: email,
          full_name: 'Fahad alamri',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()

    if (insertError) {
      console.error('❌ Error creating user record:', insertError)
      return
    }

    console.log('✅ Successfully created user record with correct ID')

    // 4. Verify the fix
    console.log('\n4️⃣ Verifying the fix...')
    
    // Test users query
    const { data: usersTest, error: usersTestError } = await supabase
      .from('users')
      .select('status,role')
      .eq('id', correctUserId)
    
    if (usersTestError) {
      console.log('❌ Users query still failing:', usersTestError.message)
    } else {
      console.log('✅ Users query now works:', usersTest)
    }

    // Test profiles query  
    const { data: profilesTest, error: profilesTestError } = await supabase
      .from('profiles')
      .select('status,role')
      .eq('id', correctUserId)
    
    if (profilesTestError) {
      console.log('❌ Profiles query still failing:', profilesTestError.message)
    } else {
      console.log('✅ Profiles query working:', profilesTest)
    }

    console.log('\n🎉 User ID mismatch fixed!')
    console.log('   The API endpoints should now work correctly.')
    console.log('   Please refresh your browser to test.')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

fixUserIdMismatch()
