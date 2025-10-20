import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Make.com General Contract Webhook received');

    // Get the webhook secret from headers
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.MAKE_WEBHOOK_SECRET;

    // Verify webhook secret
    if (!webhookSecret || !expectedSecret || webhookSecret !== expectedSecret) {
      console.log('❌ Webhook secret verification failed');
      console.log('Received:', webhookSecret);
      console.log('Expected:', expectedSecret);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid webhook secret' },
        { status: 401 }
      );
    }

    console.log('✅ Webhook secret verified');

    // Parse the request body
    const body = await request.json();
    console.log('📤 General Contract Webhook payload:', body);

    // Validate required fields
    const {
      contract_type,
      promoter_id,
      first_party_id,
      second_party_id,
      job_title,
      department,
      work_location,
      basic_salary,
      contract_start_date,
      contract_end_date,
    } = body;

    // Validate required fields
    if (!contract_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_type is required',
        },
        { status: 400 }
      );
    }

    if (!promoter_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'promoter_id is required',
        },
        { status: 400 }
      );
    }

    if (!first_party_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'first_party_id is required',
        },
        { status: 400 }
      );
    }

    if (!second_party_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'second_party_id is required',
        },
        { status: 400 }
      );
    }

    // Generate contract_id and contract_number if they're empty
    let finalContractId = body.contract_id;
    let finalContractNumber = body.contract_number;

    if (!finalContractId || finalContractId.trim() === '') {
      // Generate a UUID for contract_id using a more compatible method
      finalContractId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
      console.log('🆔 Generated contract_id:', finalContractId);
    }

    if (!finalContractNumber || finalContractNumber.trim() === '') {
      // Generate contract number with format: GEN-DDMMYYYY-XXXX
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      finalContractNumber = `GEN-${day}${month}${year}-${random}`;
      console.log('🔢 Generated contract_number:', finalContractNumber);
    }

    // Create Supabase client
    const supabase = await createClient();

    // Check if contract already exists
    let contract: any = null;
    if (finalContractId) {
      const { data: existingContract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', finalContractId)
        .single();

      if (contractError && contractError.code !== 'PGRST116') {
        console.error('❌ Error fetching contract:', contractError);
        console.error('❌ Contract ID:', finalContractId);
        console.error('❌ Error code:', contractError.code);
        console.error('❌ Error message:', contractError.message);
        console.log('⚠️ Continuing with contract creation despite fetch error');
      }

      contract = existingContract;
    }

    if (finalContractNumber && !contract) {
      const { data: existingContract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_number', finalContractNumber)
        .single();

      if (contractError && contractError.code !== 'PGRST116') {
        console.error('❌ Error fetching contract by number:', contractError);
        console.error('❌ Contract Number:', finalContractNumber);
        console.error('❌ Error code:', contractError.code);
        console.error('❌ Error message:', contractError.message);
        console.log('⚠️ Continuing with contract creation despite fetch error');
      }

      contract = existingContract;
    }

    // If contract exists, update it
    if (contract) {
      console.log(
        '📝 Updating existing general contract:',
        (contract as any).id
      );

      const updateData: any = {
        contract_type,
        updated_at: new Date().toISOString(),
      };

      if (promoter_id) updateData.promoter_id = promoter_id;
      if (first_party_id) updateData.client_id = first_party_id; // first_party is client
      if (second_party_id) updateData.employer_id = second_party_id; // second_party is employer

      const supabaseClient = supabase as any;
      const { data: updatedContract, error: updateError } = await supabaseClient
        .from('contracts')
        .update(updateData)
        .eq('id', (contract as any).id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating contract:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update contract' },
          { status: 500 }
        );
      }

      console.log('✅ General contract updated successfully');
      return NextResponse.json({
        success: true,
        message: 'General contract updated successfully',
        contract_id: (updatedContract as any).id,
        contract_number: (updatedContract as any).contract_number,
        status: 'updated',
        template_id: '1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA', // General contract template ID
        // Image placeholders for Make.com Module 56
        image_placeholders: {
          promoter_id_card_image: {
            placeholder: '{{promoter_id_card_image}}',
            url: body.promoter_id_card_url || '',
            alt_text: 'ID Card',
          },
          promoter_passport_image: {
            placeholder: '{{promoter_passport_image}}',
            url: body.promoter_passport_url || '',
            alt_text: 'Passport',
          },
        },
      });
    }

    // Create new general contract
    console.log('🆕 Creating new general contract');

    const contractData: any = {
      contract_type,
      contract_number: finalContractNumber,
      title: `${contract_type} Contract - ${finalContractNumber}`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (promoter_id) contractData.promoter_id = promoter_id;
    if (first_party_id) contractData.client_id = first_party_id; // first_party is client
    if (second_party_id) contractData.employer_id = second_party_id; // second_party is employer

    // Map date fields from webhook data - ensure dates are always provided
    if (body.contract_start_date) {
      // Handle both YYYY-MM-DD and DD-MM-YYYY formats
      let startDate = body.contract_start_date;
      if (startDate.includes('-')) {
        const parts = startDate.split('-');
        if (parts[0].length === 4) {
          // Already in YYYY-MM-DD format
          contractData.start_date = startDate;
        } else {
          // Convert DD-MM-YYYY to YYYY-MM-DD format
          startDate = parts.reverse().join('-');
          contractData.start_date = startDate;
        }
      }
    } else {
      // Set default start date if not provided
      contractData.start_date = new Date().toISOString().split('T')[0];
    }

    if (body.contract_end_date) {
      // Handle both YYYY-MM-DD and DD-MM-YYYY formats
      let endDate = body.contract_end_date;
      if (endDate.includes('-')) {
        const parts = endDate.split('-');
        if (parts[0].length === 4) {
          // Already in YYYY-MM-DD format
          contractData.end_date = endDate;
        } else {
          // Convert DD-MM-YYYY to YYYY-MM-DD format
          endDate = parts.reverse().join('-');
          contractData.end_date = endDate;
        }
      }
    } else {
      // Set default end date (1 year from start date) if not provided
      const startDate =
        contractData.start_date || new Date().toISOString().split('T')[0];
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      contractData.end_date = endDate.toISOString().split('T')[0];
    }

    // Map other fields - ensure title is always set
    if (body.job_title && body.job_title.trim() !== '') {
      contractData.title = `${body.job_title} - ${contract_type} Contract - ${finalContractNumber}`;
    } else {
      contractData.title = `${contract_type} Contract - ${finalContractNumber}`;
    }

    if (body.basic_salary) contractData.value = parseFloat(body.basic_salary);
    if (body.special_terms) contractData.terms = body.special_terms;

    // Add additional fields if provided
    if (body.department && body.department.trim() !== '') {
      contractData.description = `Department: ${body.department}`;
    }
    if (body.work_location && body.work_location.trim() !== '') {
      contractData.description =
        (contractData.description || '') +
        `\nWork Location: ${body.work_location}`;
    }

    // Add general contract specific fields
    if (body.product_name) {
      contractData.description =
        (contractData.description || '') +
        `\nProduct/Service: ${body.product_name}`;
    }
    if (body.service_description) {
      contractData.description =
        (contractData.description || '') +
        `\nService Description: ${body.service_description}`;
    }
    if (body.project_duration) {
      contractData.description =
        (contractData.description || '') +
        `\nProject Duration: ${body.project_duration}`;
    }
    if (body.deliverables) {
      contractData.description =
        (contractData.description || '') +
        `\nDeliverables: ${body.deliverables}`;
    }
    if (body.payment_terms) {
      contractData.description =
        (contractData.description || '') +
        `\nPayment Terms: ${body.payment_terms}`;
    }

    const { data: newContract, error: createError } = await (supabase as any)
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating general contract:', createError);
      console.error('❌ Contract data that failed:', contractData);
      console.error('❌ Error code:', createError.code);
      console.error('❌ Error details:', createError.details);
      console.error('❌ Error hint:', createError.hint);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create general contract',
          details: createError.message,
          error_code: createError.code,
          error_hint: createError.hint,
          contract_data: contractData,
          domain: 'portal.thesmartpro.io',
        },
        { status: 500 }
      );
    }

    console.log('✅ General contract created successfully');
    return NextResponse.json({
      success: true,
      message: 'General contract created successfully',
      contract_id: (newContract as any).id,
      contract_number: (newContract as any).contract_number,
      status: 'created',
      template_id: '1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA', // General contract template ID
      // Image placeholders for Make.com Module 56
      image_placeholders: {
        promoter_id_card_image: {
          placeholder: '{{promoter_id_card_image}}',
          url: body.promoter_id_card_url || '',
          alt_text: 'ID Card',
        },
        promoter_passport_image: {
          placeholder: '{{promoter_passport_image}}',
          url: body.promoter_passport_url || '',
          alt_text: 'Passport',
        },
      },
    });
  } catch (error) {
    console.error('❌ General contract webhook processing failed:', error);
    console.error(
      '❌ Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        domain: 'portal.thesmartpro.io',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Make.com General Contract Webhook Endpoint',
    status: 'active',
    usage: 'Send POST requests with general contract data',
    required_headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': 'Your webhook secret',
    },
    required_fields: {
      contract_type: 'string (required)',
      promoter_id: 'string (required)',
      first_party_id: 'string (required)',
      second_party_id: 'string (required)',
      job_title: 'string (required)',
      department: 'string (required)',
      work_location: 'string (required)',
      basic_salary: 'number (required)',
      contract_start_date: 'string (required)',
      contract_end_date: 'string (required)',
    },
    optional_fields: {
      product_name: 'string',
      service_description: 'string',
      project_duration: 'string',
      deliverables: 'string',
      payment_terms: 'string',
      termination_clause: 'string',
      confidentiality_clause: 'string',
      intellectual_property: 'string',
      liability_insurance: 'string',
      force_majeure: 'string',
      special_terms: 'string',
      probation_period: 'string',
      notice_period: 'string',
      working_hours: 'string',
      housing_allowance: 'number',
      transport_allowance: 'number',
    },
  });
}
