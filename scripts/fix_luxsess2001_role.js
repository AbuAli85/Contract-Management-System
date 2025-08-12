import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixLuxsess2001Role() {
  try {
    console.log('🔧 Fixing role for luxsess2001@gmail.com...');

    const targetUserId = '947d9e41-8d7b-4604-978b-4cb2819b8794';
    const targetEmail = 'luxsess2001@gmail.com';

    console.log(`Target User ID: ${targetUserId}`);
    console.log(`Target Email: ${targetEmail}`);

    // Step 1: Update users table
    console.log('📝 Updating users table...');
    const { data: userUpdate, error: userError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .eq('email', targetEmail)
      .select();

    if (userError) {
      console.error('❌ Error updating users table:', userError);
    } else {
      console.log('✅ Users table updated:', userUpdate);
    }

    // Step 2: Update profiles table if it exists
    console.log('📝 Updating profiles table...');
    const { data: profileUpdate, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: targetUserId,
        email: targetEmail,
        full_name: 'Fahad alamri',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .select();

    if (profileError) {
      console.error('❌ Error updating profiles table:', profileError);
    } else {
      console.log('✅ Profiles table updated:', profileUpdate);
    }

    // Step 3: Verify the change
    console.log('🔍 Verifying the change...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', targetUserId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying user:', verifyError);
    } else {
      console.log('✅ Verification result:', verifyUser);
      if (verifyUser.role === 'admin') {
        console.log('🎉 SUCCESS: User role has been updated to admin!');
      } else {
        console.log(
          '⚠️ WARNING: User role is still not admin:',
          verifyUser.role
        );
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixLuxsess2001Role();
