import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { WorkItemUpsertInput } from './types';

type AdminClient = SupabaseClient<Database>;

function getClient(): AdminClient {
  return getSupabaseAdmin();
}

export async function upsertWorkItem(input: WorkItemUpsertInput): Promise<void> {
  const supabase = getClient();

  const { companyId, workType, entityType, entityId } = input;

  // Find existing work item by composite business key:
  // (company_id, entity_type, entity_id, work_type)
  const { data: existing, error: fetchError } = await supabase
    .from('work_items' as any)
    .select('id')
    .eq('company_id', companyId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('work_type', workType)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found; anything else we surface to the caller
    throw fetchError;
  }

  const payload: any = {
    company_id: companyId,
    work_type: workType,
    entity_type: entityType,
    entity_id: entityId,
    status: input.status,
    title: input.title ?? null,
    due_at: input.dueAt ?? null,
    assignee_id: input.assigneeId ?? null,
    source: input.source ?? null,
    metadata: input.metadata ?? null,
    created_by: input.createdBy ?? null,
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('work_items' as any)
      .update(payload)
      .eq('id', existing.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('work_items' as any)
      .insert(payload);

    if (insertError) {
      throw insertError;
    }
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
    throw error;
  }
}

