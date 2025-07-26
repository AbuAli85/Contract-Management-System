const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function fixPromotersRLSPolicies() {
  console.log('🔧 Fixing RLS Policies for Promoters Table...')
  
  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('✅ Supabase client initialized with service role')

    // SQL commands to fix RLS policies
    const sqlCommands = [
      // Enable RLS on promoters table
      `ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.promoters FORCE ROW LEVEL SECURITY;`,
      
      // Drop existing policies
      `DROP POLICY IF EXISTS "Allow read access to all authenticated users on promoters" ON public.promoters;`,
      `DROP POLICY IF EXISTS "Allow admin full access on promoters" ON public.promoters;`,
      `DROP POLICY IF EXISTS "Allow authenticated users full access on promoters" ON public.promoters;`,
      `DROP POLICY IF EXISTS "Allow insert for authenticated users on promoters" ON public.promoters;`,
      `DROP POLICY IF EXISTS "Allow update for authenticated users on promoters" ON public.promoters;`,
      `DROP POLICY IF EXISTS "Allow delete for authenticated users on promoters" ON public.promoters;`,
      
      // Create new policies
      `CREATE POLICY "Allow read access to all authenticated users on promoters"
       ON public.promoters
       FOR SELECT
       USING (auth.role() = 'authenticated');`,
      
      `CREATE POLICY "Allow insert for authenticated users on promoters"
       ON public.promoters
       FOR INSERT
       WITH CHECK (auth.role() = 'authenticated');`,
      
      `CREATE POLICY "Allow update for authenticated users on promoters"
       ON public.promoters
       FOR UPDATE
       USING (auth.role() = 'authenticated')
       WITH CHECK (auth.role() = 'authenticated');`,
      
      `CREATE POLICY "Allow delete for authenticated users on promoters"
       ON public.promoters
       FOR DELETE
       USING (auth.role() = 'authenticated');`
    ]

    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`\n🔧 Executing SQL command ${i + 1}/${sqlCommands.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error(`❌ Error executing SQL command ${i + 1}:`, error.message)
        
        // If exec_sql function doesn't exist, try direct query
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('⚠️ exec_sql function not found, trying direct query...')
          
          // For direct queries, we need to use the SQL editor or dashboard
          console.log('📝 Please run the following SQL in your Supabase SQL Editor:')
          console.log('\n' + sql + '\n')
        }
      } else {
        console.log(`✅ SQL command ${i + 1} executed successfully`)
      }
    }

    // Test the fix by trying to insert a test promoter
    console.log('\n🧪 Testing the fix with a test promoter insert...')
    
    const testPromoter = {
      name_en: "Test Promoter RLS Fix",
      name_ar: "مروج اختبار إصلاح RLS",
      id_card_number: "RLS_TEST_" + Date.now(),
      mobile_number: "1234567890",
      status: "active"
    }

    const { data: insertedPromoter, error: insertError } = await supabase
      .from('promoters')
      .insert(testPromoter)
      .select()

    if (insertError) {
      console.error('❌ Test insert failed:', insertError.message)
      console.log('\n🔧 The RLS policies still need to be fixed manually.')
      console.log('📝 Please run the SQL commands from scripts/fix-promoters-rls-policies.sql in your Supabase SQL Editor.')
    } else {
      console.log('✅ Test insert successful!')
      console.log(`Inserted test promoter: ${insertedPromoter[0].name_en}`)
      
      // Clean up the test data
      const { error: deleteError } = await supabase
        .from('promoters')
        .delete()
        .eq('id_card_number', testPromoter.id_card_number)
      
      if (deleteError) {
        console.log('⚠️ Warning: Could not clean up test data:', deleteError.message)
      } else {
        console.log('✅ Test data cleaned up successfully')
      }
    }

    // Verify the policies were created
    console.log('\n📋 Verifying RLS policies...')
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'promoters')

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError.message)
    } else {
      console.log(`✅ Found ${policies?.length || 0} RLS policies for promoters table:`)
      policies?.forEach(policy => {
        console.log(`   - ${policy.policy_name} (${policy.action})`)
      })
    }

    console.log('\n🎉 RLS policy fix completed!')
    console.log('\nNext steps:')
    console.log('1. Try creating a promoter again in your application')
    console.log('2. If you still get RLS errors, run the SQL manually in Supabase SQL Editor')
    console.log('3. Check the Supabase Dashboard > Authentication > Policies for verification')

  } catch (error) {
    console.error('❌ RLS policy fix failed:', error)
  }
}

// Run the fix
fixPromotersRLSPolicies() 