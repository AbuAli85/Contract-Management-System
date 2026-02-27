import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { logger } from '@/lib/logger';
import {
  upsertWorkItem,
  upsertInputFromTask,
  upsertInputFromWorkflowInstance,
  upsertInputFromContractAction,
} from '@/lib/work-engine';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const days = Math.max(parseInt(daysParam || '30', 10) || 30, 1);

    const { role, companyId } = await getCompanyRole(supabase);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active company set. Please select an active company first.',
        },
        { status: 400 }
      );
    }

    // Admin-only backfill
    if (role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin role required to rebuild inbox.' },
        { status: 403 }
      );
    }

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - days);
    const windowStartIso = windowStart.toISOString();

    let taskCount = 0;
    let workflowCount = 0;
    let contractActionCount = 0;

    // 1) Tasks in the window
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', windowStartIso)
        .limit(1000);

      if (tasksError) {
        logger.error(
          'Failed to fetch tasks for inbox rebuild',
          { error: tasksError, companyId },
          'api/inbox/rebuild'
        );
      } else if (tasks && tasks.length > 0) {
        for (const task of tasks) {
          try {
            await upsertWorkItem(upsertInputFromTask(task as any, user.id));
            taskCount += 1;
          } catch (err) {
            logger.error(
              'Failed to upsert work_item from task during rebuild',
              { error: err, taskId: task.id },
              'api/inbox/rebuild'
            );
          }
        }
      }
    } catch (err) {
      logger.error(
        'Unexpected error while rebuilding tasks',
        { error: err, companyId },
        'api/inbox/rebuild'
      );
    }

    // 2) Workflow instances in the window
    try {
      const { data: instances, error: wfError } = await supabase
        .from('workflow_instances')
        .select('*')
        .eq('company_id', companyId)
        .gte('started_at', windowStartIso)
        .limit(1000);

      if (wfError) {
        logger.error(
          'Failed to fetch workflow_instances for inbox rebuild',
          { error: wfError, companyId },
          'api/inbox/rebuild'
        );
      } else if (instances && instances.length > 0) {
        for (const instance of instances) {
          try {
            await upsertWorkItem(
              upsertInputFromWorkflowInstance(instance as any, {
                createdBy: null,
                assigneeId: (instance as any).assigned_to ?? null,
              } as any)
            );
            workflowCount += 1;
          } catch (err) {
            logger.error(
              'Failed to upsert work_item from workflow_instance during rebuild',
              { error: err, instanceId: instance.id },
              'api/inbox/rebuild'
            );
          }
        }
      }
    } catch (err) {
      logger.error(
        'Unexpected error while rebuilding workflow_instances',
        { error: err, companyId },
        'api/inbox/rebuild'
      );
    }

    // 3) Contract actions in the window
    try {
      const { data: actions, error: caError } = await supabase
        .from('contract_actions')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', windowStartIso)
        .limit(1000);

      if (caError) {
        logger.error(
          'Failed to fetch contract_actions for inbox rebuild',
          { error: caError, companyId },
          'api/inbox/rebuild'
        );
      } else if (actions && actions.length > 0) {
        for (const action of actions) {
          try {
            await upsertWorkItem(upsertInputFromContractAction(action as any));
            contractActionCount += 1;
          } catch (err) {
            logger.error(
              'Failed to upsert work_item from contract_action during rebuild',
              { error: err, actionId: action.id },
              'api/inbox/rebuild'
            );
          }
        }
      }
    } catch (err) {
      logger.error(
        'Unexpected error while rebuilding contract_actions',
        { error: err, companyId },
        'api/inbox/rebuild'
      );
    }

    return NextResponse.json({
      success: true,
      days,
      companyId,
      totals: {
        tasks: taskCount,
        workflow_instances: workflowCount,
        contract_actions: contractActionCount,
      },
    });
  } catch (error: any) {
    logger.error(
      'Unexpected error in POST /api/inbox/rebuild',
      { error },
      'api/inbox/rebuild'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

