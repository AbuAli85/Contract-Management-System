import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';
import { workflowEngine } from '@/lib/services/workflow-engine.service';

/**
 * POST /api/workflows/[id]/execute
 * 
 * Execute a workflow manually or via trigger
 */
export const POST = withAnyRBAC(
  ['company:manage:all', 'admin:all'],
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id } = await params;
      const body = await request.json();
      const triggerData = body.trigger_data || {};

      // Execute workflow
      const result = await workflowEngine.executeWorkflow(
        id,
        triggerData,
        user.id
      );

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Workflow execution failed',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        executionId: result.executionId,
        message: 'Workflow executed successfully',
      });
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

