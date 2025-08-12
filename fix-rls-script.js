import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSRecursion() {
  console.log('🔧 Fixing RLS recursion policies...');

  try {
    // Drop problematic recursive policies
    const dropQueries = [
      'DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;',
      'DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;',
      'DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;',
      'DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;',
      'DROP POLICY IF EXISTS "Safe admin view all profiles" ON profiles;',
      'DROP POLICY IF EXISTS "Safe admin update all profiles" ON profiles;',
    ];

    for (const query of dropQueries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) console.log(`Note: ${error.message}`);
    }

    // Create safe admin check function
    const createFunction = `
    CREATE OR REPLACE FUNCTION is_admin()
    RETURNS BOOLEAN AS $$
    BEGIN
        RETURN auth.uid() = '611d9a4a-b202-4112-9869-cff47872ac40'::uuid OR
               EXISTS (
                   SELECT 1 FROM auth.users 
                   WHERE auth.users.id = auth.uid() 
                   AND auth.users.email = 'luxsess2001@gmail.com'
               );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`;

    console.log('Creating safe admin function...');
    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql: createFunction,
    });
    if (funcError) {
      console.error('Function creation error:', funcError);
    } else {
      console.log('✅ Admin function created successfully');
    }

    // Create safe policies
    const safePolicy1 = `
    CREATE POLICY "Safe admin view all profiles" ON profiles
        FOR SELECT USING (auth.uid() = id OR is_admin());`;

    const safePolicy2 = `
    CREATE POLICY "Safe admin update all profiles" ON profiles
        FOR UPDATE USING (auth.uid() = id OR is_admin());`;

    console.log('Creating safe policies...');
    const { error: policy1Error } = await supabase.rpc('exec_sql', {
      sql: safePolicy1,
    });
    if (policy1Error) {
      console.error('Policy 1 error:', policy1Error);
    } else {
      console.log('✅ Safe view policy created');
    }

    const { error: policy2Error } = await supabase.rpc('exec_sql', {
      sql: safePolicy2,
    });
    if (policy2Error) {
      console.error('Policy 2 error:', policy2Error);
    } else {
      console.log('✅ Safe update policy created');
    }

    console.log('🎉 RLS recursion fix completed!');
  } catch (error) {
    console.error('❌ Error fixing RLS recursion:', error);
  }
}

fixRLSRecursion();
