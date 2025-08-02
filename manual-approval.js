// Manual approval test - direct database update
console.log('🧪 Manual Approval Test');

// Get environment variables
const supabaseUrl = 'https://recoycngcofgofmznupubase.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.log('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node manual-approval.js');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

async function manualApproval() {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // First, get pending users
    console.log('1. Getting pending users...');
    const { data: pending, error: pendingError } = await supabase
      .from('profiles')
      .select('id, email, status')
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('❌ Error getting pending users:', pendingError);
      return;
    }
    
    console.log(`Found ${pending.length} pending users:`);
    pending.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.id})`);
    });
    
    if (pending.length === 0) {
      console.log('✅ No pending users to approve!');
      return;
    }
    
    // Approve the first user
    const userToApprove = pending[0];
    console.log(`\n2. Approving user: ${userToApprove.email}`);
    
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userToApprove.id)
      .select();
    
    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }
    
    console.log('✅ Update result:', updated);
    
    // Verify the update
    console.log('\n3. Verifying update...');
    const { data: verified, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, status, updated_at')
      .eq('id', userToApprove.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }
    
    console.log('✅ Current status:', verified);
    
    if (verified.status === 'active') {
      console.log('🎉 SUCCESS: User is now active!');
    } else {
      console.log('❌ PROBLEM: User status is still:', verified.status);
    }
    
    // Check how many pending users remain
    console.log('\n4. Checking remaining pending users...');
    const { data: remaining, error: remainingError } = await supabase
      .from('profiles')
      .select('id, email, status')
      .eq('status', 'pending');
    
    if (!remainingError) {
      console.log(`Remaining pending users: ${remaining.length}`);
      remaining.forEach(user => {
        console.log(`  - ${user.email}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

manualApproval();
