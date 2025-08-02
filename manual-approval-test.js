const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function manualApproval() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔍 Finding pending users...');

    // Get pending users
    const { data: pendingUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, status')
      .eq('status', 'pending');

    if (fetchError) {
      console.error('❌ Error fetching pending users:', fetchError);
      return;
    }

    console.log(`📊 Found ${pendingUsers.length} pending users:`);
    pendingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.id}): ${user.status}`);
    });

    if (pendingUsers.length > 0) {
      console.log('\n🔄 Manually approving the first user...');
      const userToApprove = pendingUsers[0];
      
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userToApprove.id)
        .select();

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
      } else {
        console.log('✅ Successfully updated user:', updated);
        
        // Verify the update
        const { data: verified, error: verifyError } = await supabase
          .from('profiles')
          .select('id, email, status')
          .eq('id', userToApprove.id)
          .single();
          
        if (!verifyError) {
          console.log('✅ Verification - User status is now:', verified.status);
        }
      }
    }

  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

manualApproval();
