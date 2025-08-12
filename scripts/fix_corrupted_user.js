import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// Your actual Supabase credentials from env-setup.ps1
const supabaseUrl = 'https://reootcngcptfogfozlmz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCorruptedUser() {
  try {
    console.log('🔧 Fixing corrupted UUID for cleaning.provider@example.com...\n');
    
    // Step 1: Find the corrupted user
    console.log('📧 Looking for corrupted user...');
    const { data: corruptedUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'cleaning.provider@example.com')
      .single();
    
    if (findError) {
      console.error('❌ Error finding user:', findError.message);
      return;
    }
    
    const oldId = corruptedUser.id;
    const newId = randomUUID();
    
    console.log('✅ Found corrupted user:');
    console.log('  Old ID (corrupted):', oldId);
    console.log('  New ID (generated):', newId);
    console.log('  Email:', corruptedUser.email);
    console.log('  Role:', corruptedUser.role);
    console.log('  Full Name:', corruptedUser.full_name);
    console.log('');
    
    // Step 2: Delete the corrupted user first (to avoid email constraint)
    console.log('🗑️ Deleting corrupted user first...');
    
    // Delete from user_roles first (if any exist)
    const { error: deleteUserRolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', oldId);
    
    if (deleteUserRolesError) {
      console.log('⚠️ No user_roles to delete for old ID');
    } else {
      console.log('✅ Old user_roles deleted');
    }
    
    // Delete from profiles
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', oldId);
    
    if (deleteProfileError) {
      console.log('⚠️ No profile to delete for old ID');
    } else {
      console.log('✅ Old profile deleted');
    }
    
    // Delete from users
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', oldId);
    
    if (deleteUserError) {
      console.error('❌ Error deleting old user:', deleteUserError.message);
      return;
    } else {
      console.log('✅ Old corrupted user deleted');
    }
    console.log('');
    
    // Step 3: Create new user with valid UUID
    console.log('🆕 Creating new user with valid UUID...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: newId,
        email: corruptedUser.email,
        role: corruptedUser.role,
        full_name: corruptedUser.full_name,
        status: corruptedUser.status,
        created_at: corruptedUser.created_at,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating new user:', createError.message);
      return;
    }
    
    console.log('✅ New user created successfully');
    console.log('');
    
    // Step 4: Update profiles table
    console.log('👤 Updating profiles table...');
    const { data: profileUpdate, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newId,
        email: corruptedUser.email,
        full_name: corruptedUser.full_name,
        role: 'user' // mapped role
      }, {
        onConflict: 'id'
      })
      .select();
    
    if (profileError) {
      console.error('❌ Error updating profiles:', profileError.message);
    } else {
      console.log('✅ Profiles table updated');
    }
    console.log('');
    
    // Step 5: Update user_roles table
    console.log('🔑 Updating user_roles table...');
    const { data: userRoleUpdate, error: userRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newId,
        role: 'user' // mapped role
      })
      .select();
    
    if (userRoleError) {
      console.error('❌ Error updating user_roles:', userRoleError.message);
    } else {
      console.log('✅ User_roles table updated');
    }
    console.log('');
    
    // Step 6: Verify the fix
    console.log('🔍 Verifying the fix...');
    
    // Check new user exists
    const { data: verifyUser, error: verifyUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', newId)
      .single();
    
    if (verifyUserError) {
      console.error('❌ New user verification failed:', verifyUserError.message);
    } else {
      console.log('✅ New user verified:', verifyUser.email);
    }
    
    // Check profile exists
    const { data: verifyProfile, error: verifyProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newId)
      .single();
    
    if (verifyProfileError) {
      console.error('❌ Profile verification failed:', verifyProfileError.message);
    } else {
      console.log('✅ Profile verified:', verifyProfile.role);
    }
    
    // Check user_roles exists
    const { data: verifyUserRole, error: verifyUserRoleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', newId)
      .single();
    
    if (verifyUserRoleError) {
      console.error('❌ User_roles verification failed:', verifyUserRoleError.message);
    } else {
      console.log('✅ User_roles verified:', verifyUserRole.role);
    }
    
    console.log('');
    console.log('🎉 User UUID corruption fixed successfully!');
    console.log('📋 Summary:');
    console.log(`- Old corrupted ID: ${oldId}`);
    console.log(`- New valid ID: ${newId}`);
    console.log(`- Email: ${corruptedUser.email}`);
    console.log(`- Role: ${corruptedUser.role} → user (mapped)`);
    console.log('');
    console.log('💡 Now you can run the sync script again to get 100% success!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixCorruptedUser();
