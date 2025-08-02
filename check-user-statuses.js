const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkUserStatuses() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔍 Checking current user statuses in database...');

    // Get all users with their current status
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, status, role, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log('\n📊 Current user statuses:');
    users.forEach(user => {
      console.log(`  ${user.email}: ${user.status} (${user.role}) - Last updated: ${user.updated_at}`);
    });

    console.log('\n🔍 Pending users specifically:');
    const pendingUsers = users.filter(u => u.status === 'pending');
    if (pendingUsers.length === 0) {
      console.log('  ✅ No pending users found in database!');
    } else {
      pendingUsers.forEach(user => {
        console.log(`  ⏳ ${user.email}: ${user.status} (${user.role})`);
      });
    }

    console.log('\n🔍 Active users:');
    const activeUsers = users.filter(u => u.status === 'active');
    activeUsers.forEach(user => {
      console.log(`  ✅ ${user.email}: ${user.status} (${user.role})`);
    });

  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

checkUserStatuses();
