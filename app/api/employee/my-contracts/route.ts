import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Get all contracts for the current employee/promoter
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, expired, all

    // First, find the promoter record for this user
    const { data: promoter } = await supabase
      .from('promoters')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!promoter) {
      return NextResponse.json({
        success: true,
        contracts: [],
        count: 0,
        message: 'No promoter profile found',
      });
    }

    // Build query for contracts
    let query = supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        title,
        description,
        type,
        contract_type,
        status,
        start_date,
        end_date,
        basic_salary,
        total_value,
        currency,
        products_en,
        products_ar,
        location_en,
        location_ar,
        pdf_url,
        is_current,
        created_at,
        employer:employer_id (
          id,
          name_en,
          name_ar,
          logo_url
        ),
        client:client_id (
          id,
          name_en,
          name_ar,
          logo_url
        )
      `)
      .eq('promoter_id', promoter.id)
      .order('start_date', { ascending: false });

    // Filter by status if specified
    const now = new Date().toISOString().slice(0, 10);
    if (status === 'active') {
      query = query.gte('end_date', now).lte('start_date', now);
    } else if (status === 'expired') {
      query = query.lt('end_date', now);
    } else if (status === 'upcoming') {
      query = query.gt('start_date', now);
    }

    const { data: contracts, error: contractsError } = await query;

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return NextResponse.json(
        { error: 'Failed to fetch contracts' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const allContracts = contracts || [];
    const activeContracts = allContracts.filter(c => {
      const startDate = new Date(c.start_date);
      const endDate = new Date(c.end_date);
      const today = new Date();
      return startDate <= today && endDate >= today;
    });
    const expiredContracts = allContracts.filter(c => 
      new Date(c.end_date) < new Date()
    );

    return NextResponse.json({
      success: true,
      contracts: allContracts,
      count: allContracts.length,
      stats: {
        total: allContracts.length,
        active: activeContracts.length,
        expired: expiredContracts.length,
        current: allContracts.find(c => c.is_current) || null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/employee/my-contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

