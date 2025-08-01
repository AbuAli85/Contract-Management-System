const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please make sure your .env file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (preferred)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
  console.log('=== Disabling RLS for Import ===');
  
  try {
    // Disable RLS on parties table
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE parties DISABLE ROW LEVEL SECURITY;' 
    });
    
    if (error) {
      console.error('❌ Error disabling RLS:', error.message);
      console.log('💡 You may need to run this manually in your Supabase dashboard');
      console.log('SQL: ALTER TABLE parties DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✅ RLS disabled successfully');
      console.log('🔄 You can now run the import script');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please run this SQL manually in your Supabase dashboard:');
    console.log('ALTER TABLE parties DISABLE ROW LEVEL SECURITY;');
  }
}

disableRLS().catch(console.error); 