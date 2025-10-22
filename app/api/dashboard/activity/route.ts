import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/activity - Get recent activity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get recent contracts (as activity)
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, contract_number, title, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activity' },
        { status: 500 }
      );
    }

    const activities = (contracts || []).map((contract: any) => ({
      id: contract.id,
      type: 'contract',
      action: contract.created_at === contract.updated_at ? 'created' : 'updated',
      title: contract.contract_number,
      description: contract.title || 'Untitled Contract',
      timestamp: contract.updated_at || contract.created_at,
      link: `/en/contracts/${contract.id}`,
    }));

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('Activity GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

