import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all employers (parties with type='Employer')
    const { data: employers, error: employersError } = await supabase
      .from('parties')
      .select('*')
      .eq('type', 'Employer')
      .order('name_en');

    if (employersError) {
      console.error('Error fetching employers:', employersError);
      return NextResponse.json(
        { error: 'Failed to fetch employers', details: employersError.message },
        { status: 500 }
      );
    }

    // Fetch all promoters
    const { data: allPromoters, error: promotersError } = await supabase
      .from('promoters')
      .select('*')
      .order('name_en');

    if (promotersError) {
      console.error('Error fetching promoters:', promotersError);
      return NextResponse.json(
        { error: 'Failed to fetch promoters', details: promotersError.message },
        { status: 500 }
      );
    }

    // Fetch all contracts to map promoters to employers
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('promoter_id, employer_id, first_party_id');

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return NextResponse.json(
        { error: 'Failed to fetch contracts', details: contractsError.message },
        { status: 500 }
      );
    }

    // Build employer-promoter mapping
    const employersWithPromoters = (employers || []).map(employer => {
      // Get contracts where this employer is either first_party or employer_id
      const employerContracts =
        contracts?.filter(
          c => c.employer_id === employer.id || c.first_party_id === employer.id
        ) || [];

      // Get unique promoter IDs from contracts
      const promoterIdsFromContracts = [
        ...new Set(
          employerContracts
            .map(c => c.promoter_id)
            .filter((id): id is string => id !== null && id !== undefined)
        ),
      ];

      // Get promoters associated with this employer (via employer_id or contracts)
      const employerPromoters =
        allPromoters?.filter(
          p =>
            p.employer_id === employer.id ||
            promoterIdsFromContracts.includes(p.id)
        ) || [];

      return {
        ...employer,
        promoters: employerPromoters,
        promoterCount: employerPromoters.length,
      };
    });

    // Calculate summary statistics
    const totalEmployers = employers?.length || 0;
    const totalPromoters = allPromoters?.length || 0;
    const avgPromotersPerEmployer =
      totalEmployers > 0 ? (totalPromoters / totalEmployers).toFixed(1) : '0';

    return NextResponse.json({
      success: true,
      data: {
        employers: employersWithPromoters,
        summary: {
          totalEmployers,
          totalPromoters,
          avgPromotersPerEmployer: parseFloat(avgPromotersPerEmployer),
        },
      },
    });
  } catch (error) {
    console.error('Error in employer-promoters analytics API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
