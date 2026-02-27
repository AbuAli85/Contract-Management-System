import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { WorkItemUpsertInput } from './types';
import { logger } from '@/lib/logger';

type AdminClient = SupabaseClient<Database>;

function getClient(): AdminClient {
  return getSupabaseAdmin();
}

export async function upsertWorkItem(input: WorkItemUpsertInput): Promise<void> {
  const supabase = getClient();

  const payload: any = {
    company_id: input.companyId,
    work_type: input.workType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    status: input.status,
    title: input.title ?? null,
    due_at: input.dueAt ?? null,
    sla_due_at: input.slaDueAt ?? null,
    assignee_id: input.assigneeId ?? null,
    source: input.source ?? null,
    metadata: input.metadata ?? null,
    created_by: input.createdBy ?? null,
  };

  const { error } = await supabase
    .from('work_items' as any)
    .upsert(payload, {
      onConflict: 'company_id,entity_type,entity_id',
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to upsert work_item', { error, input }, 'work-engine');
    throw error;
  }
}

/**
 * Mark a work item as completed (or cancelled) based on entity identity.
 * Uses the same composite key as upsertWorkItem.
 */
export async function completeWorkItem(
  companyId: string,
  entityType: string,
  entityId: string,
  finalStatus: 'done' | 'cancelled' = 'done'
): Promise<void> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('work_items' as any)
    .select('id')
    .eq('company_id', companyId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle();

  if (error) {
    logger.error('Failed to load work_item for completion', { error, companyId, entityType, entityId }, 'work-engine');
    throw error;
  }

  if (!data?.id) {
    return;
  }

  const { error: updateError } = await supabase
    .from('work_items' as any)
    .update({ status: finalStatus })
    .eq('id', data.id);

  if (updateError) {
    logger.error('Failed to update work_item status', { error: updateError, companyId, entityType, entityId, finalStatus }, 'work-engine');
    throw updateError;
  }
}

/**
 * Assign/unassign a work item by its primary key id.
 */
export async function assignWorkItemById(
  workItemId: string,
  assigneeId: string | null
): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('work_items' as any)
    .update({ assignee_id: assigneeId })
    .eq('id', workItemId);

  if (error) {
    logger.error('Failed to assign work_item', { error, workItemId, assigneeId }, 'work-engine');
    throw error;
  }
}

