require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function fixProfilesTable() {
  console.log('🔧 Fixing Profiles Table Structure...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Adding missing columns...');
    
    // Add missing columns one by one
    const columnsToAdd = [
      'ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE',
      'ADD COLUMN IF NOT EXISTS phone TEXT',
      'ADD COLUMN IF NOT EXISTS address JSONB',
      'ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT \'{}\''
    ];

    for (const columnDef of columnsToAdd) {
      try {
        const { error } = await supabase
          .rpc('exec_sql', { 
            sql: `ALTER TABLE profiles ${columnDef};`
          });
        
        if (error) {
          console.log(`❌ Failed to add column: ${columnDef}`);
          console.log(`   Error: ${error.message}`);
        } else {
          console.log(`✅ Added column: ${columnDef}`);
        }
      } catch (err) {
        console.log(`❌ Error adding column: ${err.message}`);
      }
    }

    console.log('\n📋 Step 2: Removing incorrect columns...');
    
    // Remove columns that shouldn't be there
    const columnsToRemove = ['role', 'status'];
    
    for (const column of columnsToRemove) {
      try {
        const { error } = await supabase
          .rpc('exec_sql', { 
            sql: `ALTER TABLE profiles DROP COLUMN IF EXISTS ${column};`
          });
        
        if (error) {
          console.log(`❌ Failed to remove column: ${column}`);
          console.log(`   Error: ${error.message}`);
        } else {
          console.log(`✅ Removed column: ${column}`);
        }
      } catch (err) {
        console.log(`❌ Error removing column: ${err.message}`);
      }
    }

    console.log('\n📋 Step 3: Adding constraints...');
    
    // Add constraints
    const constraints = [
      'ADD CONSTRAINT IF NOT EXISTS profiles_user_id_unique UNIQUE (user_id)',
      'ADD CONSTRAINT IF NOT EXISTS profiles_email_unique UNIQUE (email)'
    ];

    for (const constraint of constraints) {
      try {
        const { error } = await supabase
          .rpc('exec_sql', { 
            sql: `ALTER TABLE profiles ${constraint};`
          });
        
        if (error) {
          console.log(`❌ Failed to add constraint: ${constraint}`);
          console.log(`   Error: ${error.message}`);
        } else {
          console.log(`✅ Added constraint: ${constraint}`);
        }
      } catch (err) {
        console.log(`❌ Error adding constraint: ${err.message}`);
      }
    }

    console.log('\n📋 Step 4: Verifying table structure...');
    
    // Test the fixed table
    const columnsToTest = ['id', 'user_id', 'email', 'full_name', 'phone', 'address', 'preferences', 'created_at'];
    
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ Column '${column}': ${error.message}`);
        } else {
          console.log(`✅ Column '${column}': Accessible`);
        }
      } catch (err) {
        console.log(`❌ Column '${column}': ${err.message}`);
      }
    }

    console.log('\n🎉 Profiles table structure fix completed!');
    console.log('💡 Note: You may need to update existing user_id values manually');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixProfilesTable();
