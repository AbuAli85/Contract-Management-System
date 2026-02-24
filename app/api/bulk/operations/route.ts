import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

/**
 * POST /api/bulk/operations
 *
 * Execute bulk operations on multiple records
 * Supports: employees, documents, tasks, targets, attendance
 */
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
        operation_type, // 'update_status', 'delete', 'export', 'assign', 'bulk_notify'
        resource_type, // 'employees', 'documents', 'tasks', 'targets', 'attendance'
        record_ids,
        update_data,
        _filters,
      } = body;

      if (
        !operation_type ||
        !resource_type ||
        !record_ids ||
        record_ids.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: operation_type, resource_type, record_ids',
          },
          { status: 400 }
        );
      }

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      let results: any = {
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Execute based on resource type
      switch (resource_type) {
        case 'employees':
          results = await bulkUpdateEmployees(
            supabase,
            operation_type,
            record_ids,
            update_data,
            profile?.active_company_id
          );
          break;

        case 'documents':
          results = await bulkUpdateDocuments(
            supabase,
            operation_type,
            record_ids,
            update_data
          );
          break;

        case 'tasks':
          results = await bulkUpdateTasks(
            supabase,
            operation_type,
            record_ids,
            update_data
          );
          break;

        case 'targets':
          results = await bulkUpdateTargets(
            supabase,
            operation_type,
            record_ids,
            update_data
          );
          break;

        default:
          return NextResponse.json(
            { error: `Unsupported resource type: ${resource_type}` },
            { status: 400 }
          );
      }

      return NextResponse.json(results);
    } catch (error: any) {
      console.error('Error in bulk operation:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// Bulk update employees
async function bulkUpdateEmployees(
  supabase: any,
  operation: string,
  recordIds: string[],
  updateData: any,
  companyId?: string
) {
  const results = {
    success: true,
    processed: recordIds.length,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const id of recordIds) {
    try {
      let query = supabase
        .from('employer_employees')
        .update(updateData)
        .eq('id', id);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { error } = await query;

      if (error) {
        results.failed++;
        results.errors.push(`Employee ${id}: ${error.message}`);
      } else {
        results.succeeded++;
      }
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Employee ${id}: ${error.message}`);
    }
  }

  results.success = results.failed === 0;
  return results;
}

// Bulk update documents
async function bulkUpdateDocuments(
  supabase: any,
  operation: string,
  recordIds: string[],
  updateData: any
) {
  const results = {
    success: true,
    processed: recordIds.length,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const id of recordIds) {
    try {
      const { error } = await supabase
        .from('employee_documents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        results.failed++;
        results.errors.push(`Document ${id}: ${error.message}`);
      } else {
        results.succeeded++;
      }
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Document ${id}: ${error.message}`);
    }
  }

  results.success = results.failed === 0;
  return results;
}

// Bulk update tasks
async function bulkUpdateTasks(
  supabase: any,
  operation: string,
  recordIds: string[],
  updateData: any
) {
  const results = {
    success: true,
    processed: recordIds.length,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const id of recordIds) {
    try {
      const { error } = await supabase
        .from('employee_tasks')
        .update(updateData)
        .eq('id', id);

      if (error) {
        results.failed++;
        results.errors.push(`Task ${id}: ${error.message}`);
      } else {
        results.succeeded++;
      }
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Task ${id}: ${error.message}`);
    }
  }

  results.success = results.failed === 0;
  return results;
}

// Bulk update targets
async function bulkUpdateTargets(
  supabase: any,
  operation: string,
  recordIds: string[],
  updateData: any
) {
  const results = {
    success: true,
    processed: recordIds.length,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const id of recordIds) {
    try {
      const { error } = await supabase
        .from('employee_targets')
        .update(updateData)
        .eq('id', id);

      if (error) {
        results.failed++;
        results.errors.push(`Target ${id}: ${error.message}`);
      } else {
        results.succeeded++;
      }
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Target ${id}: ${error.message}`);
    }
  }

  results.success = results.failed === 0;
  return results;
}
