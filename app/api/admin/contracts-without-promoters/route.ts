// API endpoint for managing contracts without promoters
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET: List contracts without promoters
export const GET = withRBAC('contract:read:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const priority = searchParams.get('priority'); // 'high', 'medium', 'low'

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role for access control
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = (userProfile as any)?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_promoter_assignment_stats');

    if (statsError) {
      console.error('Error fetching stats:', statsError);
    }

    // Get contracts without promoters using the view
    let query = supabase
      .from('contracts_needing_promoters')
      .select('*');

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: contracts, error: contractsError } = await query;

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch contracts',
          details: contractsError.message,
        },
        { status: 500 }
      );
    }

    // Get suggestions for each contract
    const contractsWithSuggestions = await Promise.all(
      (contracts || []).map(async (contract: any) => {
        const { data: suggestions } = await supabase
          .from('promoter_suggestions')
          .select(`
            *,
            promoters:suggested_promoter_id (
              id,
              name_en,
              name_ar,
              email,
              mobile_number,
              status
            )
          `)
          .eq('contract_id', contract.id)
          .eq('is_applied', false)
          .order('confidence_score', { ascending: false })
          .limit(5);

        return {
          ...contract,
          suggestions: suggestions || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        contracts: contractsWithSuggestions,
        stats: stats?.[0] || null,
        pagination: {
          limit,
          offset,
          total: contractsWithSuggestions.length,
        },
      },
    });
  } catch (error) {
    console.error('Error in contracts-without-promoters API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
});

// POST: Generate suggestions for a contract
export const POST = withRBAC('contract:create:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { contractId, maxSuggestions = 5 } = body;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = (userProfile as any)?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    if (!contractId) {
      return NextResponse.json(
        { error: 'contract_id is required' },
        { status: 400 }
      );
    }

    // Call the suggest_promoters_for_contract function
    const { data: suggestions, error: suggestError } = await supabase
      .rpc('suggest_promoters_for_contract', {
        p_contract_id: contractId,
        p_max_suggestions: maxSuggestions,
      });

    if (suggestError) {
      console.error('Error generating suggestions:', suggestError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate suggestions',
          details: suggestError.message,
        },
        { status: 500 }
      );
    }

    // Store suggestions in the database
    const suggestionsToInsert = (suggestions || []).map((s: any) => ({
      contract_id: contractId,
      suggested_promoter_id: s.promoter_id,
      confidence_score: s.confidence_score,
      suggestion_reason: s.reason,
    }));

    if (suggestionsToInsert.length > 0) {
      await supabase
        .from('promoter_suggestions')
        .upsert(suggestionsToInsert, {
          onConflict: 'contract_id,suggested_promoter_id',
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        contract_id: contractId,
        suggestions: suggestions || [],
      },
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
});

// PUT: Bulk assign promoters to contracts
export const PUT = withRBAC('contract:edit:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { assignments } = body;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = (userProfile as any)?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { error: 'assignments array is required' },
        { status: 400 }
      );
    }

    // Validate assignments format
    const validAssignments = assignments.filter(
      (a: any) => a.contract_id && a.promoter_id
    );

    if (validAssignments.length === 0) {
      return NextResponse.json(
        { error: 'No valid assignments provided' },
        { status: 400 }
      );
    }

    // Call bulk_assign_promoters function
    const { data: results, error: assignError } = await supabase
      .rpc('bulk_assign_promoters', {
        p_assignments: validAssignments,
        p_assigned_by: user.id,
      });

    if (assignError) {
      console.error('Error bulk assigning promoters:', assignError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to assign promoters',
          details: assignError.message,
        },
        { status: 500 }
      );
    }

    const successCount = (results || []).filter((r: any) => r.success).length;
    const failureCount = (results || []).length - successCount;

    return NextResponse.json({
      success: true,
      data: {
        results: results || [],
        summary: {
          total: validAssignments.length,
          successful: successCount,
          failed: failureCount,
        },
      },
    });
  } catch (error) {
    console.error('Error in bulk assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
});

