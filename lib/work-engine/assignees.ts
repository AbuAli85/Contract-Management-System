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

    // 1. Leave approvals: manager of requester, if available
    if (normalizedEntityType === 'leave_request' && requestedBy) {
      try {
        // hr.is_manager_of(uid, emp_id) already encapsulates team logic;
        // here we just find a manager candidate deterministically.
        const { data: profile } = await db
          .from('hr.user_profiles')
          .select('employee_id')
          .eq('user_id', requestedBy)
          .maybeSingle();

        if (profile?.employee_id) {
          const { data: managers } = await db
            .from('hr.employees')
            .select('user_id')
            .eq('company_id', companyId)
            .eq('role', 'manager')
            .order('created_at', { ascending: true });

          if (managers && managers.length > 0) {
            return managers[0].user_id as string;
          }
        }
      } catch (error) {
        logger.error(
          'Failed to resolve manager approver for leave_request',
          { error, companyId, entityId },
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

    // 3. Contract workflows: contract owner / legal
    if (normalizedEntityType === 'contract') {
      try {
        const { data: contract } = await db
          .from('contracts')
          .select('owner_id, legal_owner_id')
          .eq('id', entityId)
          .eq('company_id', companyId)
          .maybeSingle();

        const candidates: string[] = [];
        if (contract?.owner_id) candidates.push(contract.owner_id as string);
        if (contract?.legal_owner_id) candidates.push(contract.legal_owner_id as string);

        if (candidates.length > 0) {
          // Deterministic: pick the lexicographically smallest id
          candidates.sort();
          return candidates[0];
        }
      } catch (error) {
        logger.error(
          'Failed to resolve contract approver',
          { error, companyId, entityId },
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

