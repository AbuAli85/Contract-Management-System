import type {
  TaskLike,
  WorkflowInstanceLike,
  ContractActionLike,
  WorkItemUpsertInput,
} from './types';

export function upsertInputFromTask(
  task: TaskLike,
  userId: string
): WorkItemUpsertInput {
  const normalizedStatus = (task.status || '').toLowerCase();
  const isDone = normalizedStatus === 'done';

  return {
    companyId: task.company_id,
    workType: 'task',
    entityType: 'task',
    entityId: task.id,
    status: isDone ? 'done' : 'open',
    title: task.title,
    dueAt: task.due_date ?? null,
    assigneeId: task.assigned_to ?? null,
    source: 'tasks',
    metadata: task.related_contract_id
      ? { related_contract_id: task.related_contract_id }
      : null,
    createdBy: userId,
  };
}

export function upsertInputFromContractAction(
  action: ContractActionLike
): WorkItemUpsertInput {
  const status = (action.status || 'open').toLowerCase() as WorkItemUpsertInput['status'];

  return {
    companyId: action.company_id,
    workType: 'contract_renewal',
    entityType: 'contract_action',
    entityId: action.id,
    status: status === 'done' || status === 'completed' ? 'done' : 'open',
    title: 'Contract renewal',
    dueAt: action.due_at,
    slaDueAt: action.due_at,
    assigneeId: null,
    source: 'contracts',
    metadata: {
      contract_id: action.contract_id,
      action_type: action.action_type,
    },
    createdBy: null,
  };
}

export function upsertInputFromWorkflowInstance(
  instance: WorkflowInstanceLike,
  options: { createdBy?: string; assigneeId?: string | null } = {}
): WorkItemUpsertInput {
  const state = (instance.current_state || '').toLowerCase();

  const terminalDoneStates = new Set([
    'approved',
    'active',
    'signed',
    'archived',
    'completed',
  ]);

  const terminalCancelledStates = new Set([
    'rejected',
    'terminated',
    'expired',
    'cancelled',
  ]);

  const isTerminalDone = terminalDoneStates.has(state);
  const isTerminalCancelled = terminalCancelledStates.has(state);
  const isTerminal = isTerminalDone || isTerminalCancelled;

  let status: WorkItemUpsertInput['status'];
  if (isTerminalDone) {
    status = 'done';
  } else if (isTerminalCancelled) {
    status = 'cancelled';
  } else {
    // Non-terminal workflow states that require attention are treated as pending
    status = 'pending';
  }

  // Infer work type for workflow instances – for now, treat them as approvals.
  const workType: WorkItemUpsertInput['workType'] = 'approval';

  // Infer source from entity_type (contracts vs HR vs other)
  let source: string | null = null;
  const entityType = (instance.entity_type || '').toLowerCase();
  if (entityType === 'contract') {
    source = 'contracts';
  } else if (
    entityType === 'leave_request' ||
    entityType === 'attendance_request'
  ) {
    source = 'hr';
  }

  const title = `Workflow: ${instance.entity_type} → ${instance.current_state}`;

  const metadata: Record<string, unknown> = {
    workflow_instance_id: instance.id,
    workflow_entity_type: instance.entity_type,
    workflow_entity_id: instance.entity_id,
    current_state: instance.current_state,
  };

  // SLA / due calculation:
  // - If instance has an explicit due_at, prefer that for both dueAt and slaDueAt.
  // - Otherwise, for pending approvals, set slaDueAt = now + 2 days.
  let dueAt: string | null = instance.due_at ?? null;
  let slaDueAt: string | null = null;

  if (instance.due_at) {
    slaDueAt = instance.due_at;
  } else if (workType === 'approval' && status === 'pending') {
    const now = new Date();
    now.setDate(now.getDate() + 2);
    slaDueAt = now.toISOString();
  }

  // Assignee resolution precedence:
  // - If workflow instance already has assigned_to, keep it.
  // - Else, if caller provided an explicit assigneeId, use that.
  const assigneeId: string | null =
    instance.assigned_to ?? (options.assigneeId ?? null);

  return {
    companyId: instance.company_id,
    workType,
    entityType: instance.entity_type,
    entityId: instance.entity_id,
    status,
    title,
    dueAt,
    assigneeId,
    slaDueAt,
    source,
    metadata,
    createdBy: options.createdBy ?? null,
  };
}

