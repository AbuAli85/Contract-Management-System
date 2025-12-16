import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface ActionItem {
  id: string;
  type: 'leave_request' | 'document_expiry' | 'contract_approval' | 'task_overdue' | 'onboarding';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl: string;
  count?: number;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active company
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    const actionItems: ActionItem[] = [];

    // 1. Pending Leave Requests (for employers/managers)
    if (userProfile?.role === 'employer' || userProfile?.role === 'admin') {
      try {
        const { data: teamMembers } = await supabase
          .from('employer_employees')
          .select('id')
          .eq('employer_id', user.id);

        if (teamMembers && teamMembers.length > 0) {
          const employerEmployeeIds = teamMembers.map(m => m.id);
          
          const { data: pendingLeaves } = await (supabaseAdmin.from('employee_leave_requests') as any)
            .select('id, created_at')
            .in('employer_employee_id', employerEmployeeIds)
            .eq('status', 'pending');

          if (pendingLeaves && pendingLeaves.length > 0) {
            actionItems.push({
              id: 'leave_requests',
              type: 'leave_request',
              title: 'Pending Leave Requests',
              description: `${pendingLeaves.length} leave request${pendingLeaves.length > 1 ? 's' : ''} awaiting your approval`,
              priority: pendingLeaves.length > 5 ? 'high' : 'medium',
              actionUrl: '/en/employer/team?tab=leave',
              count: pendingLeaves.length,
              createdAt: pendingLeaves[0]?.created_at || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        // Table might not exist, skip
        console.log('Leave requests table not available');
      }
    }

    // 2. Document Expiry Alerts (for all roles)
    try {
      const { data: expiringDocs } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, id_card_expiry_date, passport_expiry_date')
        .or('id_card_expiry_date.not.is.null,passport_expiry_date.not.is.null');

      if (expiringDocs) {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const expiringCount = expiringDocs.filter(p => {
          const idExpiry = p.id_card_expiry_date ? new Date(p.id_card_expiry_date) : null;
          const passportExpiry = p.passport_expiry_date ? new Date(p.passport_expiry_date) : null;
          
          return (
            (idExpiry && idExpiry <= thirtyDaysFromNow && idExpiry >= today) ||
            (passportExpiry && passportExpiry <= thirtyDaysFromNow && passportExpiry >= today)
          );
        }).length;

        if (expiringCount > 0) {
          actionItems.push({
            id: 'document_expiry',
            type: 'document_expiry',
            title: 'Documents Expiring Soon',
            description: `${expiringCount} document${expiringCount > 1 ? 's' : ''} expiring in the next 30 days`,
            priority: expiringCount > 10 ? 'high' : 'medium',
            actionUrl: '/en/promoters?filter=expiring_documents',
            count: expiringCount,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.log('Document expiry check not available');
    }

    // 3. Pending Contract Approvals (for admins/managers)
    if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
      try {
        const { data: pendingContracts } = await supabase
          .from('contracts')
          .select('id, contract_number, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        if (pendingContracts && pendingContracts.length > 0) {
          actionItems.push({
            id: 'contract_approvals',
            type: 'contract_approval',
            title: 'Pending Contract Approvals',
            description: `${pendingContracts.length} contract${pendingContracts.length > 1 ? 's' : ''} awaiting approval`,
            priority: pendingContracts.length > 5 ? 'high' : 'medium',
            actionUrl: '/en/contracts/pending',
            count: pendingContracts.length,
            createdAt: pendingContracts[0]?.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.log('Contract approvals check not available');
      }
    }

    // 4. Overdue Tasks (for employers)
    if (userProfile?.role === 'employer' || userProfile?.role === 'admin') {
      try {
        const { data: teamMembers } = await supabase
          .from('employer_employees')
          .select('id')
          .eq('employer_id', user.id);

        if (teamMembers && teamMembers.length > 0) {
          const employerEmployeeIds = teamMembers.map(m => m.id);
          const today = new Date().toISOString().split('T')[0];

          const { data: overdueTasks } = await (supabaseAdmin.from('employee_tasks') as any)
            .select('id, due_date')
            .in('employer_employee_id', employerEmployeeIds)
            .in('status', ['pending', 'in_progress'])
            .lt('due_date', today);

          if (overdueTasks && overdueTasks.length > 0) {
            actionItems.push({
              id: 'overdue_tasks',
              type: 'task_overdue',
              title: 'Overdue Tasks',
              description: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} past their due date`,
              priority: 'high',
              actionUrl: '/en/employer/team?tab=tasks&filter=overdue',
              count: overdueTasks.length,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.log('Tasks check not available');
      }
    }

    // Sort by priority (high first) and then by count
    actionItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return (b.count || 0) - (a.count || 0);
    });

    return NextResponse.json({
      success: true,
      actionItems,
      total: actionItems.length,
      highPriority: actionItems.filter(item => item.priority === 'high').length,
    });
  } catch (error) {
    console.error('Error fetching action items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

