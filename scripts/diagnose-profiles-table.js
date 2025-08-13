require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function diagnoseProfilesTable() {
  console.log('🔍 Diagnosing Profiles Table Structure...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test 1: Try to get table info using raw SQL
    console.log('📋 Test 1: Getting table structure via raw SQL...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'profiles' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (tableError) {
      console.log('❌ Raw SQL error:', tableError.message);
      console.log('💡 Trying alternative approach...');
      
      // Alternative: Check if we can query specific columns
      console.log('\n📋 Test 1b: Testing specific column access...');
      
      const columnsToTest = ['id', 'user_id', 'email', 'full_name', 'created_at'];
      
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
    } else {
      console.log('✅ Table structure:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    // Test 2: Check if table has any data
    console.log('\n📋 Test 2: Checking if table has data...');
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log(`✅ Table has ${count} rows`);
    }

    // Test 3: Try to see what columns are actually available
    console.log('\n📋 Test 3: Testing minimal select...');
    const { data: sample, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Sample select error:', sampleError.message);
    } else {
      console.log('✅ Sample data structure:');
      if (sample && sample.length > 0) {
        const row = sample[0];
        Object.keys(row).forEach(key => {
          console.log(`  - ${key}: ${typeof row[key]} (${row[key]})`);
        });
      } else {
        console.log('  - No data in table');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

diagnoseProfilesTable();
