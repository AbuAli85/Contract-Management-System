import { createClient } from '@/lib/supabase/server';

export async function updateContractStatuses() {
  const supabase = await createClient();
  
  try {
    console.log('🔄 Starting contract status transitions...');
    
    // Get current date
    const today = new Date().toISOString().slice(0, 10);
    
    // 1. Transition approved contracts to active when start date is reached
    const { data: contractsToActivate, error: activateError } = await supabase
      .from('contracts')
      .select('id, contract_number, start_date')
      .eq('status', 'approved')
      .lte('start_date', today);
    
    if (activateError) {
      console.error('❌ Error fetching contracts to activate:', activateError);
      return { success: false, error: activateError.message };
    }
    
    if (contractsToActivate && contractsToActivate.length > 0) {
      const { error: updateActivateError } = await supabase
        .from('contracts')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'approved')
        .lte('start_date', today);
      
      if (updateActivateError) {
        console.error('❌ Error activating contracts:', updateActivateError);
        return { success: false, error: updateActivateError.message };
      }
      
      console.log(`✅ Activated ${contractsToActivate.length} contracts`);
      
      // Log the transitions
      for (const contract of contractsToActivate) {
        try {
          await supabase
            .from('contract_audit_log')
            .insert({
              contract_id: contract.id,
              action: 'status_transition',
              performed_by: 'system',
              details: `Contract automatically activated on start date: ${contract.start_date}`,
              timestamp: new Date().toISOString(),
            });
        } catch (err) {
          console.warn('Failed to log contract activation:', err);
        }
      }
    }
    
    // 2. Transition active contracts to expired when end date is reached
    const { data: contractsToExpire, error: expireError } = await supabase
      .from('contracts')
      .select('id, contract_number, end_date')
      .eq('status', 'active')
      .lt('end_date', today);
    
    if (expireError) {
      console.error('❌ Error fetching contracts to expire:', expireError);
      return { success: false, error: expireError.message };
    }
    
    if (contractsToExpire && contractsToExpire.length > 0) {
      const { error: updateExpireError } = await supabase
        .from('contracts')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'active')
        .lt('end_date', today);
      
      if (updateExpireError) {
        console.error('❌ Error expiring contracts:', updateExpireError);
        return { success: false, error: updateExpireError.message };
      }
      
      console.log(`✅ Expired ${contractsToExpire.length} contracts`);
      
      // Log the transitions
      for (const contract of contractsToExpire) {
        try {
          await supabase
            .from('contract_audit_log')
            .insert({
              contract_id: contract.id,
              action: 'status_transition',
              performed_by: 'system',
              details: `Contract automatically expired on end date: ${contract.end_date}`,
              timestamp: new Date().toISOString(),
            });
        } catch (err) {
          console.warn('Failed to log contract expiration:', err);
        }
      }
    }
    
    const totalTransitions = (contractsToActivate?.length || 0) + (contractsToExpire?.length || 0);
    
    console.log(`🎉 Contract status transitions completed. Total transitions: ${totalTransitions}`);
    
    return {
      success: true,
      transitions: {
        activated: contractsToActivate?.length || 0,
        expired: contractsToExpire?.length || 0,
        total: totalTransitions
      }
    };
    
  } catch (error) {
    console.error('❌ Contract status transition error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// API endpoint for manual trigger or cron job
export async function POST() {
  const result = await updateContractStatuses();
  
  return Response.json(result);
}
