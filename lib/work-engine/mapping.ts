import type {
  TaskLike,
  WorkflowInstanceLike,
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

export function upsertInputFromWorkflowInstance(
  instance: WorkflowInstanceLike,
  options: { createdBy?: string } = {}
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
    current_state: instance.current_state,
  };

  return {
    companyId: instance.company_id,
    workType,
    entityType: instance.entity_type,
    entityId: instance.entity_id,
    status,
    title,
    dueAt: instance.due_at ?? null,
    assigneeId: instance.assigned_to ?? null,
    source,
    metadata,
    createdBy: options.createdBy ?? null,
  };
}

