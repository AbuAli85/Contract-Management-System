import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting Make.com contract generation...');

    const body = await request.json();
    console.log('📋 Request body:', body);

    // Validate required fields
    const requiredFields = ['promoter_id', 'first_party_id', 'second_party_id'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create contract record
    const contractData = {
      promoter_id: body.promoter_id,
      first_party_id: body.first_party_id,
      second_party_id: body.second_party_id,
      contract_type: body.contract_type || 'full-time-permanent',
      job_title: body.job_title || '',
      department: body.department || '',
      work_location: body.work_location || '',
      basic_salary: body.basic_salary || 0,
      contract_start_date: body.contract_start_date || '',
      contract_end_date: body.contract_end_date || '',
      special_terms: body.special_terms || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    console.log('📝 Creating contract record...');
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert(contractData as any)
      .select()
      .single();

    if (contractError) {
      console.error('❌ Failed to create contract:', contractError);
      return NextResponse.json(
        { error: 'Failed to create contract record' },
        { status: 500 }
      );
    }

    console.log('✅ Contract created:', (contract as any)?.id);

    // Fetch promoter data
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('*')
      .eq('id', body.promoter_id)
      .single();

    if (promoterError) {
      console.error('❌ Failed to fetch promoter:', promoterError);
      return NextResponse.json(
        { error: 'Failed to fetch promoter data' },
        { status: 500 }
      );
    }

    // Fetch first party (Client) data
    const { data: firstParty, error: firstPartyError } = await supabase
      .from('parties')
      .select('*')
      .eq('id', body.first_party_id)
      .single();

    if (firstPartyError) {
      console.error('❌ Failed to fetch first party:', firstPartyError);
      return NextResponse.json(
        { error: 'Failed to fetch first party data' },
        { status: 500 }
      );
    }

    // Fetch second party (Employer) data
    const { data: secondParty, error: secondPartyError } = await supabase
      .from('parties')
      .select('*')
      .eq('id', body.second_party_id)
      .single();

    if (secondPartyError) {
      console.error('❌ Failed to fetch second party:', secondPartyError);
      return NextResponse.json(
        { error: 'Failed to fetch second party data' },
        { status: 500 }
      );
    }

    // Type assertions for data
    const promoterData = promoter as any;
    const firstPartyData = firstParty as any;
    const secondPartyData = secondParty as any;

    // Prepare Make.com payload
    const makecomPayload = {
      contract_id: (contract as any)?.id,
      contract_number: (contract as any)?.contract_number,
      contract_type: body.contract_type,

      // Promoter data
      promoter_id: body.promoter_id,
      promoter_name_en: promoterData.name_en,
      promoter_name_ar: promoterData.name_ar,
      promoter_email: promoterData.email,
      promoter_mobile_number: promoterData.mobile_number,
      promoter_id_card_number: promoterData.id_card_number,
      promoter_passport_number: promoterData.passport_number,
      promoter_id_card_url: promoterData.id_card_url,
      promoter_passport_url: promoterData.passport_url,

      // First party data (Client)
      first_party_id: body.first_party_id,
      first_party_name_en: firstPartyData.name_en,
      first_party_name_ar: firstPartyData.name_ar,
      first_party_crn: firstPartyData.crn,
      first_party_email: firstPartyData.email,
      first_party_phone: firstPartyData.phone,

      // Second party data (Employer)
      second_party_id: body.second_party_id,
      second_party_name_en: secondPartyData.name_en,
      second_party_name_ar: secondPartyData.name_ar,
      second_party_crn: secondPartyData.crn,
      second_party_email: secondPartyData.email,
      second_party_phone: secondPartyData.phone,

      // Contract details
      job_title: body.job_title,
      department: body.department,
      work_location: body.work_location,
      basic_salary: body.basic_salary,
      contract_start_date: body.contract_start_date,
      contract_end_date: body.contract_end_date,
      special_terms: body.special_terms || '',
      currency: 'OMR',

      // Additional fields for templates
      contract_date: new Date().toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
    };

    console.log('📤 Sending to Make.com...');

    // Trigger Make.com webhook
    const makecomResponse = await fetch(process.env.MAKECOM_WEBHOOK_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(makecomPayload),
    });

    if (!makecomResponse.ok) {
      console.error('❌ Make.com webhook failed:', makecomResponse.status);
      return NextResponse.json(
        {
          error: 'Make.com webhook failed',
          details: `HTTP ${makecomResponse.status}: ${makecomResponse.statusText}`,
          contract_id: (contract as any)?.id || 'unknown',
        },
        { status: 500 }
      );
    }

    const makecomResult = await makecomResponse.json();
    console.log('✅ Make.com response:', makecomResult);

    // Update contract with Make.com result
    const updateData: any = {
      status: 'processing',
      makecom_scenario_id: makecomResult.scenario_id || null,
      makecom_execution_id: makecomResult.execution_id || null,
      updated_at: new Date().toISOString(),
    };

    // If Make.com returns document URLs, update the contract
    if (makecomResult.document_url) {
      updateData.document_url = makecomResult.document_url;
    }
    if (makecomResult.pdf_url) {
      updateData.pdf_url = makecomResult.pdf_url;
    }

    try {
      const { error: updateError } = await (supabase as any)
        .from('contracts')
        .update(updateData as any)
        .eq('id', (contract as any)?.id);

      if (updateError) {
        console.error('❌ Failed to update contract:', updateError);
      }
    } catch (updateErr) {
      console.error('❌ Update error:', updateErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Contract generation initiated successfully',
      data: {
        contract_id: (contract as any)?.id,
        contract_number: (contract as any)?.contract_number,
        status: 'processing',
        makecom_result: makecomResult,
        estimated_completion: '2-5 minutes',
      },
    });
  } catch (error) {
    console.error('❌ Make.com contract generation error:', error);
    return NextResponse.json(
      {
        error: 'Contract generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
