import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/contracts/expiring - Get contracts expiring soon
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

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

    // Calculate the date threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    // Get contracts expiring within the threshold
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, contract_number, title, end_date, status')
      .eq('status', 'active')
      .lte('end_date', thresholdDate.toISOString())
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expiring contracts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contracts: contracts || [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
