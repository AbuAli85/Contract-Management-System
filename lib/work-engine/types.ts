import type { Json } from '@/types/supabase';

export type WorkItemStatus = 'pending' | 'open' | 'done' | 'cancelled';

export type WorkItemType = 'task' | 'approval' | string;

export interface WorkItemUpsertInput {
  companyId: string;
  workType: WorkItemType;
  entityType: string;
  entityId: string;
  status: WorkItemStatus | string;
  title?: string | null;
  dueAt?: string | null;
  assigneeId?: string | null;
   slaDueAt?: string | null;
  source?: string | null;
  metadata?: Json | null;
  createdBy?: string | null;
}

// Lightweight shapes for mapper inputs. We intentionally avoid tight coupling
// to generated Supabase types so this layer can evolve with migrations.

export interface TaskLike {
  id: string;
  company_id: string;
  title: string;
  status: string;
  priority?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  related_contract_id?: string | null;
}

export interface WorkflowInstanceLike {
  id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  current_state: string;
  due_at?: string | null;
  assigned_to?: string | null;
}

