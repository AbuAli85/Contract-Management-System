import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

export const GET = withRBAC(
  'contract:read:own',
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = await params;

      // Get current user to check permissions
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch contract with related data
      // @ts-ignore - Database schema type issues
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        // @ts-ignore
        .eq('id', id)
        .single();

      if (error) {
        console.error('API GET /contracts/[id] error:', error);
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Contract not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          {
            error: 'Failed to fetch contract',
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          contract,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in GET /api/contracts/[id]:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);

export const PUT = withRBAC(
  'contract:update:own',
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = await params;

      // Get current user to check permissions
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has permission to edit contracts
      // @ts-ignore - Database schema type issues
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        // @ts-ignore
        .eq('id', user.id)
        .single();

      if (userError || !userProfile || !['admin', 'manager'].includes((userProfile as any)?.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to edit contracts' },
          { status: 403 }
        );
      }

      // Parse the request body
      const body = await request.json();

      // Build update payload with only fields that exist in the schema
      const dataToUpdate: any = {
        updated_at: new Date().toISOString(),
      };

      // Only add fields that are provided and valid
      if (body.status) dataToUpdate.status = body.status;
      if (body.start_date) dataToUpdate.start_date = body.start_date;
      if (body.end_date) dataToUpdate.end_date = body.end_date;
      if (body.contract_start_date) dataToUpdate.start_date = body.contract_start_date;
      if (body.contract_end_date) dataToUpdate.end_date = body.contract_end_date;
      if (body.value !== undefined) dataToUpdate.value = body.value;
      if (body.basic_salary !== undefined) dataToUpdate.value = body.basic_salary;
      if (body.currency) dataToUpdate.currency = body.currency;
      if (body.title) dataToUpdate.title = body.title;
      if (body.job_title) dataToUpdate.title = body.job_title;
      if (body.contract_type) dataToUpdate.contract_type = body.contract_type;
      if (body.contract_number) dataToUpdate.contract_number = body.contract_number;
      if (body.description) dataToUpdate.description = body.description;
      if (body.terms) dataToUpdate.terms = body.terms;

      console.log('🔄 Updating contract with data:', dataToUpdate);

      // Perform the update
      // @ts-ignore - Database schema type issues
      const { data: updated, error } = await supabase
        .from('contracts')
        .update(dataToUpdate)
        // @ts-ignore
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('API PUT /contracts/[id] error:', error);
        return NextResponse.json(
          {
            error: 'Update failed',
            details: error.message,
          },
          { status: 500 }
        );
      }

      // Log the activity (skip if table doesn't exist)
      try {
        await supabase.from('user_activity_log').insert({
          user_id: user.id,
          action: 'contract_update',
          resource_type: 'contract',
          resource_id: id,
          details: { updated_fields: Object.keys(dataToUpdate) },
        } as any);
      } catch (logError) {
        console.warn('Could not log activity:', logError);
        // Continue execution even if logging fails
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Contract updated successfully!',
          contract: updated,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in PUT /api/contracts/[id]:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
