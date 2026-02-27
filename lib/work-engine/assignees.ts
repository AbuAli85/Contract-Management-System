import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/logger';

interface ResolveApprovalAssigneeInput {
  companyId: string;
  entityType: string;
  entityId: string;
  currentState: string;
  requestedBy: string | null;
}

type DbClient = SupabaseClient<Database>;

/**
 * Resolve an appropriate approver for a workflow-based approval item.
 *
 * This function is intentionally conservative and best-effort:
 * - Prefers explicit relationships (manager, HR, contract owner) when available.
 * - Falls back to a company admin if no better candidate is found.
 * - Returns null if no candidate can be determined.
 */
export async function resolveApprovalAssignee(
  db: DbClient,
  input: ResolveApprovalAssigneeInput
): Promise<string | null> {
  const { companyId, entityType, entityId, currentState, requestedBy } = input;

  try {
    const normalizedEntityType = entityType.toLowerCase();
    const state = currentState.toLowerCase();

    // 1. Leave approvals: route to the requester's line manager when possible
    if (normalizedEntityType === 'leave_request' && requestedBy) {
      try {
        const { data: userProfile } = await db
          .from('hr.user_profiles')
          .select('employee_id')
          .eq('user_id', requestedBy)
          .maybeSingle();

        if (userProfile?.employee_id != null) {
          const employeeId = userProfile.employee_id;

          const { data: employee } = await db
            .from('hr.employees')
            .select('manager_user_id, manager_employee_id')
            .eq('id', employeeId)
            .maybeSingle();

          if (employee) {
            // Prefer an explicit manager_user_id if present
            if (employee.manager_user_id) {
              return employee.manager_user_id as string;
            }

            // Else, follow manager_employee_id to find that employee's user_id
            if (employee.manager_employee_id != null) {
              const { data: managerEmployee } = await db
                .from('hr.employees')
                .select('user_id')
                .eq('id', employee.manager_employee_id)
                .maybeSingle();

              if (managerEmployee?.user_id) {
                return managerEmployee.user_id as string;
              }
            }
          }
        }
      } catch (error) {
        logger.error(
          'Failed to resolve line manager approver for leave_request',
          { error, companyId, entityId, requestedBy },
          'work-engine/assignees'
        );
      }
    }

    // 2. HR workflows (leave/attendance/general HR actions): prefer HR admin
    if (
      normalizedEntityType === 'leave_request' ||
      normalizedEntityType === 'attendance_request' ||
      normalizedEntityType.startsWith('hr_')
    ) {
      try {
        const { data: hrUsers } = await db
          .from('hr.user_profiles')
          .select('user_id')
          .in('role', ['hr_admin', 'hr_staff'])
          .order('role', { ascending: true }); // admin first

        if (hrUsers && hrUsers.length > 0) {
          return hrUsers[0].user_id as string;
        }
      } catch (error) {
        logger.error(
          'Failed to resolve HR approver',
          { error, companyId, entityType, entityId },
          'work-engine/assignees'
        );
      }
    }

    // 3. Contract workflows: prefer legal reviewer in legal states, else owner
    if (normalizedEntityType === 'contract') {
      try {
        const { data: contract } = await db
          .from('contracts')
          .select('owner_user_id, legal_reviewer_user_id')
          .eq('id', entityId)
          .eq('company_id', companyId)
          .maybeSingle();

        if (contract) {
          const stateLc = state; // already lowercased currentState

          // Legal review states: prefer legal_reviewer_user_id
          if (
            stateLc.includes('legal') &&
            contract.legal_reviewer_user_id
          ) {
            return contract.legal_reviewer_user_id as string;
          }

          // Otherwise, prefer owner_user_id
          if (contract.owner_user_id) {
            return contract.owner_user_id as string;
          }
        }
      } catch (error) {
        logger.error(
          'Failed to resolve contract approver',
          { error, companyId, entityId, currentState },
          'work-engine/assignees'
        );
      }
    }

    // 4. Fallback: any admin for the company (deterministic)
    try {
      const { data: admins } = await db
        .from('user_roles')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('role', 'admin')
        .order('user_id', { ascending: true });

      if (admins && admins.length > 0) {
        return admins[0].user_id as string;
      }
    } catch (error) {
      logger.error(
        'Failed to resolve fallback admin approver',
        { error, companyId },
        'work-engine/assignees'
      );
    }

    return null;
  } catch (error) {
    logger.error(
      'Unexpected error in resolveApprovalAssignee',
      { error, input },
      'work-engine/assignees'
    );
    return null;
  }
}

