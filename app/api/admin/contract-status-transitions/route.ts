import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// POST: Manually trigger contract status transitions
export const POST = withAnyRBAC(
  ['system:admin', 'contract:admin'], // Only admins can trigger transitions
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      
      // Get current user for audit logging
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      console.log('🔄 Manual contract status transitions triggered by:', user.email);
      
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
        return NextResponse.json(
          { success: false, error: activateError.message },
          { status: 500 }
        );
      }
      
      let activatedCount = 0;
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
          return NextResponse.json(
            { success: false, error: updateActivateError.message },
            { status: 500 }
          );
        }
        
        activatedCount = contractsToActivate.length;
        console.log(`✅ Activated ${activatedCount} contracts`);
        
        // Log the transitions
        for (const contract of contractsToActivate) {
          try {
            await supabase
              .from('contract_audit_log')
              .insert({
                contract_id: contract.id,
                action: 'status_transition',
                performed_by: user.id,
                details: `Contract manually activated on start date: ${contract.start_date}`,
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
        return NextResponse.json(
          { success: false, error: expireError.message },
          { status: 500 }
        );
      }
      
      let expiredCount = 0;
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
          return NextResponse.json(
            { success: false, error: updateExpireError.message },
            { status: 500 }
          );
        }
        
        expiredCount = contractsToExpire.length;
        console.log(`✅ Expired ${expiredCount} contracts`);
        
        // Log the transitions
        for (const contract of contractsToExpire) {
          try {
            await supabase
              .from('contract_audit_log')
              .insert({
                contract_id: contract.id,
                action: 'status_transition',
                performed_by: user.id,
                details: `Contract manually expired on end date: ${contract.end_date}`,
                timestamp: new Date().toISOString(),
              });
          } catch (err) {
            console.warn('Failed to log contract expiration:', err);
          }
        }
      }
      
      const totalTransitions = activatedCount + expiredCount;
      
      console.log(`🎉 Manual contract status transitions completed. Total transitions: ${totalTransitions}`);
      
      return NextResponse.json({
        success: true,
        message: `Contract status transitions completed successfully`,
        transitions: {
          activated: activatedCount,
          expired: expiredCount,
          total: totalTransitions
        },
        triggeredBy: user.email,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Manual contract status transition error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);

// GET: Get status transition statistics
export const GET = withAnyRBAC(
  ['system:admin', 'contract:admin'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().slice(0, 10);
      
      // Get counts of contracts that need transitions
      const [approvedContracts, activeContracts] = await Promise.all([
        supabase
          .from('contracts')
          .select('id')
          .eq('status', 'approved')
          .lte('start_date', today),
        supabase
          .from('contracts')
          .select('id')
          .eq('status', 'active')
          .lt('end_date', today)
      ]);
      
      return NextResponse.json({
        success: true,
        statistics: {
          contractsToActivate: approvedContracts.data?.length || 0,
          contractsToExpire: activeContracts.data?.length || 0,
          totalPendingTransitions: (approvedContracts.data?.length || 0) + (activeContracts.data?.length || 0)
        },
        lastChecked: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Get transition statistics error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);
