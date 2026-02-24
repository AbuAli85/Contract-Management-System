import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/workflows - List workflows
export const GET = withAnyRBAC(
  ['company:read:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category');
      const isActive = searchParams.get('is_active');

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('workflows')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (profile?.active_company_id) {
        query = query.eq('company_id', profile.active_company_id);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true');
      }

      const { data: workflows, error, count } = await query;

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch workflows', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        workflows: workflows || [],
        count: count || 0,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// POST /api/workflows - Create workflow
export const POST = withAnyRBAC(
  ['company:manage:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const {
        name,
        description,
        category,
        trigger_type,
        trigger_config,
        steps,
        is_active = true,
      } = body;

      if (!name || !category || !trigger_type) {
        return NextResponse.json(
          { error: 'Missing required fields: name, category, trigger_type' },
          { status: 400 }
        );
      }

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      // Create workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          company_id: profile?.active_company_id,
          name,
          description,
          category,
          trigger_type,
          trigger_config: trigger_config || {},
          is_active,
          created_by: user.id,
        })
        .select()
        .single();

      if (workflowError || !workflow) {
        return NextResponse.json(
          {
            error: 'Failed to create workflow',
            details: workflowError?.message,
          },
          { status: 500 }
        );
      }

      // Create workflow steps
      if (steps && Array.isArray(steps) && steps.length > 0) {
        const stepInserts = steps.map((step: any, index: number) => ({
          workflow_id: workflow.id,
          step_order: index + 1,
          step_type: step.step_type,
          step_config: step.step_config || {},
          conditions: step.conditions || [],
          on_success_action: step.on_success_action,
          on_failure_action: step.on_failure_action,
          timeout_seconds: step.timeout_seconds,
          retry_count: step.retry_count || 0,
          retry_delay_seconds: step.retry_delay_seconds || 60,
        }));

        const { error: stepsError } = await supabase
          .from('workflow_steps')
          .insert(stepInserts);

        if (stepsError) {
          // Rollback workflow creation
          await supabase.from('workflows').delete().eq('id', workflow.id);
          return NextResponse.json(
            {
              error: 'Failed to create workflow steps',
              details: stepsError.message,
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        {
          success: true,
          workflow,
          message: 'Workflow created successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
