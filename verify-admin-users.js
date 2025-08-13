const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAdminUsers() {
  try {
    console.log('🔍 Verifying admin users...');

    // Check all users and their roles
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log('\n👥 All users in database:');
    console.log('='.repeat(80));
    allUsers.forEach((user, index) => {
      const roleIcon = user.role === 'admin' ? '👑' : user.role === 'provider' ? '🏢' : user.role === 'client' ? '🛒' : '👤';
      const statusIcon = user.status === 'active' ? '✅' : user.status === 'pending' ? '⏳' : '❌';
      console.log(`${index + 1}. ${roleIcon} ${user.email}`);
      console.log(`   Role: ${user.role} | Status: ${user.status} ${statusIcon}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    // Focus on admin users
    const adminUsers = allUsers.filter(user => user.role === 'admin');
    console.log(`\n👑 Admin users found: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found! This is the problem.');
      console.log('🔧 Let me fix this by promoting a user to admin...');
      
      // Promote the first active user to admin
      const activeUser = allUsers.find(user => user.status === 'active');
      if (activeUser) {
        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', activeUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Failed to promote user:', updateError);
        } else {
          console.log(`✅ Promoted ${activeUser.email} to admin`);
        }
      }
    } else {
      console.log('✅ Admin users are properly configured');
      adminUsers.forEach(admin => {
        console.log(`   👑 ${admin.email} (${admin.status})`);
      });
    }

    // Check for pending users that need approval
    const pendingUsers = allUsers.filter(user => user.status === 'pending');
    console.log(`\n⏳ Pending users: ${pendingUsers.length}`);
    pendingUsers.forEach(pending => {
      console.log(`   ⏳ ${pending.email} (${pending.role})`);
    });

    console.log('\n🎯 Testing URLs:');
    console.log('• Login: http://localhost:3002/en/auth/login');
    console.log('• User Approvals: http://localhost:3002/en/dashboard/user-approvals');
    console.log('• Registration: http://localhost:3002/en/register/provider');

  } catch (error) {
    console.error('❌ Error verifying admin users:', error);
  }
}

verifyAdminUsers();
