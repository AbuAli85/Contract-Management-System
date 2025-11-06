import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/contracts/[id] - Get a specific contract
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

      // Get user role for scoping
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = (userProfile as any)?.role === 'admin';

      // Fetch contract with related data
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
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

      // ✅ SECURITY: Non-admin users can only see contracts they're involved in
      if (!isAdmin) {
        const isInvolved =
          contract.client_id === user.id ||
          contract.employer_id === user.id ||
          contract.first_party_id === user.id ||
          contract.second_party_id === user.id;

        if (!isInvolved) {
          return NextResponse.json(
            { error: 'Unauthorized to view this contract' },
            { status: 403 }
          );
        }
      }

      // Fetch related party data
      const partyIds = [
        contract.client_id,
        contract.employer_id,
        contract.first_party_id,
        contract.second_party_id,
      ].filter(Boolean);

      let partiesData: any[] = [];
      if (partyIds.length > 0) {
        const { data: parties } = await supabase
          .from('parties')
          .select('id, name_en, name_ar, crn, type')
          .in('id', partyIds);

        if (parties) {
          partiesData = parties;
        }
      }

      // Fetch promoter data if exists
      let promoterData = null;
      if (contract.promoter_id) {
        const { data: promoter } = await supabase
          .from('promoters')
          .select(
            'id, name_en, name_ar, id_card_number, id_card_url, passport_url, status, mobile_number'
          )
          .eq('id', contract.promoter_id)
          .single();

        if (promoter) {
          promoterData = promoter;
        }
      }

      // Create lookup map
      const partiesMap = new Map(partiesData.map(p => [p.id, p]));

      // Transform contract with related data
      const transformedContract = {
        ...contract,
        first_party:
          partiesMap.get(contract.first_party_id) ||
          partiesMap.get(contract.client_id),
        second_party:
          partiesMap.get(contract.second_party_id) ||
          partiesMap.get(contract.employer_id),
        promoters: promoterData ? [promoterData] : null,
        contract_start_date: contract.start_date || contract.contract_start_date,
        contract_end_date: contract.end_date || contract.contract_end_date,
        job_title: contract.title || contract.job_title,
        contract_value:
          contract.value ||
          contract.contract_value ||
          contract.basic_salary ||
          contract.amount,
      };

      return NextResponse.json(
        {
          success: true,
          contract: transformedContract,
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

// PUT /api/contracts/[id] - Update a specific contract
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
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (
        userError ||
        !userProfile ||
        !['admin', 'manager'].includes((userProfile as any)?.role)
      ) {
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
      if (body.contract_start_date)
        dataToUpdate.start_date = body.contract_start_date;
      if (body.contract_end_date)
        dataToUpdate.end_date = body.contract_end_date;
      if (body.value !== undefined) dataToUpdate.value = body.value;
      if (body.basic_salary !== undefined)
        dataToUpdate.value = body.basic_salary;
      if (body.currency) dataToUpdate.currency = body.currency;
      if (body.title) dataToUpdate.title = body.title;
      if (body.job_title) dataToUpdate.title = body.job_title;
      if (body.contract_type) dataToUpdate.contract_type = body.contract_type;
      if (body.contract_number)
        dataToUpdate.contract_number = body.contract_number;
      if (body.description) dataToUpdate.description = body.description;
      if (body.terms) dataToUpdate.terms = body.terms;

      console.log('🔄 Updating contract with data:', dataToUpdate);

      // Perform the update
      const { data: updated, error } = await supabase
        .from('contracts')
        .update(dataToUpdate)
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

// DELETE /api/contracts/[id] - Delete a specific contract
export const DELETE = withRBAC(
  'contract:delete:own',
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

      // Check if user has permission to delete contracts (admin only)
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (
        userError ||
        !userProfile ||
        (userProfile as any)?.role !== 'admin'
      ) {
        return NextResponse.json(
          { error: 'Only administrators can delete contracts' },
          { status: 403 }
        );
      }

      // First, fetch the contract to ensure it exists
      const { data: contract, error: fetchError } = await supabase
        .from('contracts')
        .select('id, contract_number, title, status')
        .eq('id', id)
        .single();

      if (fetchError || !contract) {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      // Perform hard delete (RLS policies may prevent status='deleted')
      const { error: deleteError } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('API DELETE /contracts/[id] error:', deleteError);
        return NextResponse.json(
          {
            error: 'Delete failed',
            details: deleteError.message,
          },
          { status: 500 }
        );
      }

      // Log the activity
      try {
        await supabase.from('user_activity_log').insert({
          user_id: user.id,
          action: 'contract_delete',
          resource_type: 'contract',
          resource_id: id,
          details: {
            contract_number: contract.contract_number,
            title: contract.title,
            previous_status: contract.status,
          },
        } as any);
      } catch (logError) {
        console.warn('Could not log activity:', logError);
        // Continue execution even if logging fails
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Contract deleted successfully',
          id,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in DELETE /api/contracts/[id]:', error);
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

