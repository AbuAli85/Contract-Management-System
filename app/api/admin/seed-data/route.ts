import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

export const POST = withRBAC('data:seed:all', async (_request: NextRequest) => {
  try {
    // 🔒 SECURITY: Disable seed data endpoint in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: 'Seed data endpoint is disabled in production',
          message:
            'This endpoint is only available in development environments',
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing parties and promoters
    const { data: clients } = await supabase
      .from('parties')
      .select('id')
      .eq('type', 'Client')
      .limit(5);

    const { data: employers } = await supabase
      .from('parties')
      .select('id')
      .eq('type', 'Employer')
      .limit(3);

    const { data: promoters } = await supabase
      .from('promoters')
      .select('id')
      .limit(10);

    if (!clients?.length || !employers?.length || !promoters?.length) {
      return NextResponse.json(
        {
          error:
            'Need at least 1 client, 1 employer, and 1 promoter to create sample contracts',
        },
        { status: 400 }
      );
    }

    // Check the actual schema first
    const { data: _schemaCheck, error: schemaError } = await supabase
      .from('contracts')
      .select('first_party_id, second_party_id, client_id, employer_id')
      .limit(0);

    // Determine which schema to use based on the error
    const useNewSchema =
      !schemaError || !schemaError.message.includes('column');


    // Sample contracts data
    const sampleContracts = [
      {
        // Use appropriate party IDs based on schema
        ...(useNewSchema
          ? { first_party_id: clients[0].id, second_party_id: employers[0].id }
          : { client_id: clients[0].id, employer_id: employers[0].id }),
        promoter_id: promoters[0].id,
        contract_start_date: new Date().toISOString().split('T')[0],
        contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        job_title: 'Software Developer',
        contract_type: 'full-time-permanent',
        status: 'active',
        contract_value: 45000,
        currency: 'OMR',
        email: 'developer@company.com',
        special_terms: 'Standard employment terms with probation period',
        work_location: 'Muscat Office',
        department: 'IT Department',
        contract_number: `CNT-${new Date().getFullYear()}-001`,
      },
      {
        // Use appropriate party IDs based on schema
        ...(useNewSchema
          ? {
              first_party_id: clients[1]?.id || clients[0].id,
              second_party_id: employers[0].id,
            }
          : {
              client_id: clients[1]?.id || clients[0].id,
              employer_id: employers[0].id,
            }),
        promoter_id: promoters[1]?.id || promoters[0].id,
        contract_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        contract_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        job_title: 'Marketing Specialist',
        contract_type: 'contract',
        status: 'pending',
        contract_value: 35000,
        currency: 'OMR',
        email: 'marketing@company.com',
        special_terms: 'Fixed-term contract with renewal option',
        work_location: 'Salalah Office',
        department: 'Marketing',
        contract_number: `CNT-${new Date().getFullYear()}-002`,
      },
      {
        // Use appropriate party IDs based on schema
        ...(useNewSchema
          ? {
              first_party_id: clients[2]?.id || clients[0].id,
              second_party_id: employers[1]?.id || employers[0].id,
            }
          : {
              client_id: clients[2]?.id || clients[0].id,
              employer_id: employers[1]?.id || employers[0].id,
            }),
        promoter_id: promoters[2]?.id || promoters[0].id,
        contract_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        contract_end_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        job_title: 'Project Manager',
        contract_type: 'full-time-permanent',
        status: 'active',
        contract_value: 55000,
        currency: 'OMR',
        email: 'pm@company.com',
        special_terms: 'Senior position with team leadership responsibilities',
        work_location: 'Muscat Office',
        department: 'Operations',
        contract_number: `CNT-${new Date().getFullYear()}-003`,
      },
    ];

    // Insert sample contracts
    const { data: createdContracts, error: contractError } = await supabase
      .from('contracts')
      .insert(sampleContracts)
      .select();

    if (contractError) {
      throw new Error(`Failed to create contracts: ${contractError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      contracts: createdContracts?.length || 0,
      data: {
        clients: clients.length,
        employers: employers.length,
        promoters: promoters.length,
        contracts_created: createdContracts?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create sample data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
