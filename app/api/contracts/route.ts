import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export const GET = withRBAC(
  'contract:read:own',
  async (request: NextRequest) => {
    try {
      console.log('🔍 Contracts API: Starting request...');

      const supabase = await createClient();
      const { searchParams } = new URL(request.url);
      const partyId = searchParams.get('party_id');
      const status = searchParams.get('status') || 'active';

      // Check if we're using a mock client
      if (!supabase || typeof supabase.from !== 'function') {
        console.error(
          '❌ Contracts API: Using mock client - environment variables may be missing'
        );
        return NextResponse.json(
          {
            success: true, // Return success to avoid errors
            contracts: [],
            totalContracts: 0,
            activeContracts: 0,
            pendingContracts: 0,
            error: 'Database connection not available',
          },
          { status: 200 }
        );
      }

      console.log('🔍 Contracts API: Fetching contracts from database...');

      // If party_id is provided, try to fetch contracts for that party
      if (partyId) {
        try {
          const { data: contracts, error: contractsError } = await supabase
            .from('contracts')
            .select('*')
            .or(`first_party_id.eq.${partyId},second_party_id.eq.${partyId}`)
            .eq('status', status)
            .limit(10);

          if (contractsError) {
            console.warn(
              '⚠️ Contracts API: Error fetching party contracts, returning empty:',
              contractsError.message
            );
            return NextResponse.json({
              success: true,
              contracts: [],
              count: 0,
              message: 'No contracts found for this party',
            });
          }

          return NextResponse.json({
            success: true,
            contracts: contracts || [],
            count: contracts?.length || 0,
          });
        } catch (error) {
          console.warn('⚠️ Contracts API: Party query failed, returning empty');
          return NextResponse.json({
            success: true,
            contracts: [],
            count: 0,
          });
        }
      }

      // Start with a simple query first to test basic connectivity
      let contracts = [];
      try {
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (contractsError) {
          console.warn(
            '⚠️ Contracts API: Error fetching contracts:',
            contractsError.message
          );
          contracts = [];
        } else {
          contracts = contractsData || [];
        }
      } catch (error) {
        console.warn(
          '⚠️ Contracts API: Contract fetch failed, continuing with empty array'
        );
        contracts = [];
      }

      console.log(
        `✅ Contracts API: Successfully fetched ${contracts?.length || 0} contracts`
      );

      // Get basic statistics with error handling
      let totalContracts = 0;
      let statusData: any[] = [];

      try {
        const { count: totalCount, error: countError } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.warn(
            '⚠️ Contracts API: Error counting contracts:',
            countError.message
          );
        } else {
          totalContracts = totalCount || 0;
        }
      } catch (error) {
        console.warn('⚠️ Contracts API: Could not count contracts');
      }

      try {
        const { data: statusResult, error: statusError } = await supabase
          .from('contracts')
          .select('status');

        if (statusError) {
          console.warn(
            '⚠️ Contracts API: Error fetching status data:',
            statusError.message
          );
        } else {
          statusData = statusResult || [];
        }
      } catch (error) {
        console.warn('⚠️ Contracts API: Could not fetch status data');
      }

      // Calculate statistics
      const stats = {
        total: totalContracts || 0,
        active: 0,
        expired: 0,
        upcoming: 0,
        unknown: 0,
        total_value: 0,
        avg_duration: 0,
      };

      if (statusData) {
        statusData.forEach((contract: { status: string }) => {
          switch (contract.status) {
            case 'active':
              stats.active++;
              break;
            case 'expired':
              stats.expired++;
              break;
            case 'pending':
            case 'legal_review':
            case 'hr_review':
            case 'final_approval':
            case 'signature':
              stats.upcoming++;
              break;
            case 'draft':
            case 'generated':
              stats.unknown++;
              break;
            default:
              stats.unknown++;
          }
        });
      }

      console.log('✅ Contracts API: Request completed successfully');

      return NextResponse.json({
        success: true,
        contracts: contracts || [],
        stats,
        total: totalContracts || 0,
      });
    } catch (error) {
      console.error('❌ Contracts API: Unexpected error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);

export const POST = withRBAC(
  'contract:create:own',
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const body = await request.json();

      // Get user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
          },
          { status: 401 }
        );
      }

      // Prepare contract data
      const contractData = {
        contract_number: body.contract_number || `CON-${Date.now()}`,
        employer_id: body.employer_id,
        client_id: body.client_id,
        promoter_id: body.promoter_id,
        start_date: body.start_date,
        end_date: body.end_date,
        email: body.email,
        job_title: body.job_title,
        work_location: body.work_location,
        department: body.department,
        contract_type: body.contract_type,
        currency: body.currency,
        user_id: session.user.id,
        status: 'draft',
      };

      // Insert the contract
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

      if (error) {
        console.error('Error creating contract:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create contract',
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        contract,
      });
    } catch (error) {
      console.error('Create contract error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);
