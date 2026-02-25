/**
 * WorkflowService — application-layer adapter for the workflow engine.
 *
 * All modules (contracts, approvals, attendance, tasks) call this service
 * instead of managing their own state-machine logic. The service delegates
 * to the `workflow_transition()` and `workflow_start()` PostgreSQL functions.
 *
 * Usage:
 *   const wf = new WorkflowService(supabase, companyId, userId);
 *   await wf.startContract(contractId);
 *   await wf.transition('contract', contractId, 'submit', 'Submitting for review');
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityType =
  | 'contract'
  | 'contract_approval'
  | 'attendance_request'
  | 'leave_request'
  | 'task';

export interface TransitionResult {
  success: boolean;
  eventId?: string;
  fromState?: string;
  toState?: string;
  error?: string;
}

export interface WorkflowInstance {
  id: string;
  entityType: EntityType;
  entityId: string;
  currentState: string;
  startedAt: string;
  completedAt: string | null;
  dueAt: string | null;
  assignedTo: string | null;
  metadata: Record<string, unknown>;
}

export interface WorkflowEvent {
  id: string;
  instanceId: string;
  fromState: string;
  toState: string;
  triggerName: string;
  triggeredBy: string | null;
  comment: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Default workflow definitions seeded per company on onboarding
// ---------------------------------------------------------------------------

export const DEFAULT_WORKFLOW_DEFINITIONS = {
  contract_approval: {
    name: 'contract_approval',
    entityType: 'contract' as EntityType,
    description: 'Standard contract creation → approval → execution workflow',
    states: [
      { name: 'draft',            label: 'Draft',             isInitial: true,  isTerminal: false, slaHours: null,  notifyRoles: [] },
      { name: 'pending_review',   label: 'Pending Review',    isInitial: false, isTerminal: false, slaHours: 48,    notifyRoles: ['manager', 'admin'] },
      { name: 'pending_approval', label: 'Pending Approval',  isInitial: false, isTerminal: false, slaHours: 72,    notifyRoles: ['admin'] },
      { name: 'approved',         label: 'Approved',          isInitial: false, isTerminal: false, slaHours: null,  notifyRoles: [] },
      { name: 'active',           label: 'Active',            isInitial: false, isTerminal: false, slaHours: null,  notifyRoles: [] },
      { name: 'expired',          label: 'Expired',           isInitial: false, isTerminal: true,  slaHours: null,  notifyRoles: ['admin', 'manager'] },
      { name: 'terminated',       label: 'Terminated',        isInitial: false, isTerminal: true,  slaHours: null,  notifyRoles: ['admin'] },
      { name: 'rejected',         label: 'Rejected',          isInitial: false, isTerminal: false, slaHours: null,  notifyRoles: [] },
    ],
    transitions: [
      { fromState: 'draft',            toState: 'pending_review',   triggerName: 'submit',       allowedRoles: null,                    requiresComment: false },
      { fromState: 'pending_review',   toState: 'pending_approval', triggerName: 'approve_review', allowedRoles: ['manager', 'admin'], requiresComment: false },
      { fromState: 'pending_review',   toState: 'draft',            triggerName: 'request_changes', allowedRoles: ['manager', 'admin'], requiresComment: true },
      { fromState: 'pending_approval', toState: 'approved',         triggerName: 'approve',      allowedRoles: ['admin'],               requiresComment: false },
      { fromState: 'pending_approval', toState: 'rejected',         triggerName: 'reject',       allowedRoles: ['admin'],               requiresComment: true },
      { fromState: 'rejected',         toState: 'draft',            triggerName: 'revise',       allowedRoles: null,                    requiresComment: false },
      { fromState: 'approved',         toState: 'active',           triggerName: 'activate',     allowedRoles: ['admin', 'manager'],    requiresComment: false },
      { fromState: 'active',           toState: 'expired',          triggerName: 'expire',       allowedRoles: null,                    requiresComment: false, autoTrigger: true },
      { fromState: 'active',           toState: 'terminated',       triggerName: 'terminate',    allowedRoles: ['admin'],               requiresComment: true },
    ],
  },

  attendance_approval: {
    name: 'attendance_approval',
    entityType: 'attendance_request' as EntityType,
    description: 'Attendance adjustment request workflow',
    states: [
      { name: 'submitted',  label: 'Submitted',  isInitial: true,  isTerminal: false, slaHours: 24,  notifyRoles: ['manager'] },
      { name: 'approved',   label: 'Approved',   isInitial: false, isTerminal: true,  slaHours: null, notifyRoles: [] },
      { name: 'rejected',   label: 'Rejected',   isInitial: false, isTerminal: true,  slaHours: null, notifyRoles: [] },
    ],
    transitions: [
      { fromState: 'submitted', toState: 'approved', triggerName: 'approve', allowedRoles: ['manager', 'admin'], requiresComment: false },
      { fromState: 'submitted', toState: 'rejected', triggerName: 'reject',  allowedRoles: ['manager', 'admin'], requiresComment: true },
    ],
  },

  leave_approval: {
    name: 'leave_approval',
    entityType: 'leave_request' as EntityType,
    description: 'Leave request approval workflow',
    states: [
      { name: 'draft',      label: 'Draft',      isInitial: true,  isTerminal: false, slaHours: null, notifyRoles: [] },
      { name: 'submitted',  label: 'Submitted',  isInitial: false, isTerminal: false, slaHours: 48,   notifyRoles: ['manager'] },
      { name: 'approved',   label: 'Approved',   isInitial: false, isTerminal: true,  slaHours: null, notifyRoles: [] },
      { name: 'rejected',   label: 'Rejected',   isInitial: false, isTerminal: true,  slaHours: null, notifyRoles: [] },
      { name: 'cancelled',  label: 'Cancelled',  isInitial: false, isTerminal: true,  slaHours: null, notifyRoles: [] },
    ],
    transitions: [
      { fromState: 'draft',     toState: 'submitted', triggerName: 'submit',   allowedRoles: null,                    requiresComment: false },
      { fromState: 'submitted', toState: 'approved',  triggerName: 'approve',  allowedRoles: ['manager', 'admin'],    requiresComment: false },
      { fromState: 'submitted', toState: 'rejected',  triggerName: 'reject',   allowedRoles: ['manager', 'admin'],    requiresComment: true },
      { fromState: 'submitted', toState: 'cancelled', triggerName: 'cancel',   allowedRoles: null,                    requiresComment: false },
      { fromState: 'approved',  toState: 'cancelled', triggerName: 'cancel',   allowedRoles: ['admin'],               requiresComment: true },
    ],
  },

  task_lifecycle: {
    name: 'task_lifecycle',
    entityType: 'task' as EntityType,
    description: 'Task creation → assignment → completion workflow',
    states: [
      { name: 'backlog',      label: 'Backlog',      isInitial: true,  isTerminal: false, slaHours: null, notifyRoles: [] },
      { name: 'todo',         label: 'To Do',        isInitial: false, isTerminal: false, slaHours: null, notifyRoles: [] },
      { name: 'in_progress',  label: 'In Progress',  isInitial: false, isTerminal: false, slaHours: null, notifyRoles: [] },
      { name: 'in_review',    label: 'In Review',    isInitial: false, isTerminal: false, slaHours: 24,   notifyRoles: ['manager'] },
      { name: 'done',         label: 'Done',         isInitial: false, isTerminal: true,  slaHours: null, notifyRoles: [] },
      { name: 'cancelled',    label: 'Cancelled',    isInitial: false, isTerminal: true,  slaHours: null, notifyRoles: [] },
    ],
    transitions: [
      { fromState: 'backlog',     toState: 'todo',        triggerName: 'assign',    allowedRoles: ['manager', 'admin'], requiresComment: false },
      { fromState: 'todo',        toState: 'in_progress', triggerName: 'start',     allowedRoles: null,                  requiresComment: false },
      { fromState: 'in_progress', toState: 'in_review',   triggerName: 'submit',    allowedRoles: null,                  requiresComment: false },
      { fromState: 'in_review',   toState: 'done',        triggerName: 'approve',   allowedRoles: ['manager', 'admin'], requiresComment: false },
      { fromState: 'in_review',   toState: 'in_progress', triggerName: 'revise',    allowedRoles: ['manager', 'admin'], requiresComment: true },
      { fromState: 'todo',        toState: 'cancelled',   triggerName: 'cancel',    allowedRoles: ['manager', 'admin'], requiresComment: false },
      { fromState: 'in_progress', toState: 'cancelled',   triggerName: 'cancel',    allowedRoles: ['manager', 'admin'], requiresComment: false },
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// WorkflowService
// ---------------------------------------------------------------------------

export class WorkflowService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly companyId: string,
    private readonly currentUserId: string
  ) {}

  // -------------------------------------------------------------------------
  // Start a workflow instance for an entity
  // -------------------------------------------------------------------------

  async start(
    definitionName: string,
    entityType: EntityType,
    entityId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<TransitionResult> {
    const { data, error } = await this.supabase.rpc('workflow_start', {
      p_company_id:       this.companyId,
      p_definition_name:  definitionName,
      p_entity_type:      entityType,
      p_entity_id:        entityId,
      p_created_by:       this.currentUserId,
      p_metadata:         metadata,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as TransitionResult;
  }

  // -------------------------------------------------------------------------
  // Convenience starters for each module
  // -------------------------------------------------------------------------

  async startContract(contractId: string): Promise<TransitionResult> {
    return this.start('contract_approval', 'contract', contractId);
  }

  async startAttendanceRequest(requestId: string): Promise<TransitionResult> {
    return this.start('attendance_approval', 'attendance_request', requestId);
  }

  async startLeaveRequest(requestId: string): Promise<TransitionResult> {
    return this.start('leave_approval', 'leave_request', requestId);
  }

  async startTask(taskId: string): Promise<TransitionResult> {
    return this.start('task_lifecycle', 'task', taskId);
  }

  // -------------------------------------------------------------------------
  // Fire a transition
  // -------------------------------------------------------------------------

  async transition(
    entityType: EntityType,
    entityId: string,
    triggerName: string,
    comment?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<TransitionResult> {
    // First, find the instance
    const instance = await this.getInstance(entityType, entityId);
    if (!instance) {
      return { success: false, error: `No workflow instance found for ${entityType}:${entityId}` };
    }

    const { data, error } = await this.supabase.rpc('workflow_transition', {
      p_instance_id:  instance.id,
      p_trigger_name: triggerName,
      p_triggered_by: this.currentUserId,
      p_comment:      comment ?? null,
      p_metadata:     metadata,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as TransitionResult;
  }

  // -------------------------------------------------------------------------
  // Query helpers
  // -------------------------------------------------------------------------

  async getInstance(
    entityType: EntityType,
    entityId: string
  ): Promise<WorkflowInstance | null> {
    const { data, error } = await this.supabase
      .from('workflow_instances')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('company_id', this.companyId)
      .single();

    if (error || !data) return null;

    return {
      id:           data.id,
      entityType:   data.entity_type,
      entityId:     data.entity_id,
      currentState: data.current_state,
      startedAt:    data.started_at,
      completedAt:  data.completed_at,
      dueAt:        data.due_at,
      assignedTo:   data.assigned_to,
      metadata:     data.metadata,
    };
  }

  async getHistory(
    entityType: EntityType,
    entityId: string
  ): Promise<WorkflowEvent[]> {
    const instance = await this.getInstance(entityType, entityId);
    if (!instance) return [];

    const { data, error } = await this.supabase
      .from('workflow_events')
      .select('*')
      .eq('instance_id', instance.id)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map(row => ({
      id:           row.id,
      instanceId:   row.instance_id,
      fromState:    row.from_state,
      toState:      row.to_state,
      triggerName:  row.trigger_name,
      triggeredBy:  row.triggered_by,
      comment:      row.comment,
      createdAt:    row.created_at,
    }));
  }

  async getAvailableTransitions(
    entityType: EntityType,
    entityId: string
  ): Promise<string[]> {
    const instance = await this.getInstance(entityType, entityId);
    if (!instance) return [];

    const { data, error } = await this.supabase
      .from('workflow_transitions')
      .select('trigger_name')
      .eq('from_state', instance.currentState);

    if (error || !data) return [];
    return data.map(row => row.trigger_name);
  }

  // -------------------------------------------------------------------------
  // Onboarding: seed default workflow definitions for a new company
  // -------------------------------------------------------------------------

  async seedDefaultDefinitions(): Promise<void> {
    for (const [, def] of Object.entries(DEFAULT_WORKFLOW_DEFINITIONS)) {
      // Insert definition
      const { data: defRow, error: defError } = await this.supabase
        .from('workflow_definitions')
        .upsert(
          {
            company_id:  this.companyId,
            name:        def.name,
            entity_type: def.entityType,
            description: def.description,
            is_active:   true,
          },
          { onConflict: 'company_id,name' }
        )
        .select('id')
        .single();

      if (defError || !defRow) continue;

      const definitionId = defRow.id;

      // Insert states
      for (const state of def.states) {
        await this.supabase.from('workflow_states').upsert(
          {
            definition_id: definitionId,
            name:          state.name,
            label:         state.label,
            is_initial:    state.isInitial,
            is_terminal:   state.isTerminal,
            sla_hours:     state.slaHours,
            notify_roles:  state.notifyRoles,
          },
          { onConflict: 'definition_id,name' }
        );
      }

      // Insert transitions
      for (const tr of def.transitions) {
        await this.supabase.from('workflow_transitions').upsert(
          {
            definition_id:    definitionId,
            from_state:       tr.fromState,
            to_state:         tr.toState,
            trigger_name:     tr.triggerName,
            allowed_roles:    tr.allowedRoles,
            requires_comment: tr.requiresComment,
            auto_trigger:     ('autoTrigger' in tr) ? tr.autoTrigger : false,
          },
          { onConflict: 'definition_id,from_state,trigger_name' }
        );
      }
    }
  }
}
