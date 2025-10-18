import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Make.com Simple Webhook received');

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
    console.log('📤 Webhook payload:', body);

    // Validate required fields
    const { contract_id, contract_number, contract_type, promoter_id, first_party_id, second_party_id } = body;

    // Generate contract_id and contract_number if they're empty
    let finalContractId = contract_id;
    let finalContractNumber = contract_number;

    if (!finalContractId || finalContractId.trim() === '') {
      // Generate a UUID for contract_id using a more compatible method
      finalContractId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      console.log('🆔 Generated contract_id:', finalContractId);
    }

    if (!finalContractNumber || finalContractNumber.trim() === '') {
      // Generate contract number with format: PAC-DDMMYYYY-XXXX
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      finalContractNumber = `PAC-${day}${month}${year}-${random}`;
      console.log('🔢 Generated contract_number:', finalContractNumber);
    }

    if (!contract_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_type is required',
        },
        { status: 400 }
      );
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
               return NextResponse.json(
                 { success: false, error: 'Failed to fetch contract' },
                 { status: 500 }
               );
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
               return NextResponse.json(
                 { success: false, error: 'Failed to fetch contract by number' },
                 { status: 500 }
               );
             }

             contract = existingContract;
           }

    // If contract exists, update it
    if (contract) {
      console.log('📝 Updating existing contract:', (contract as any).id);
      
      const updateData: any = {
        contract_type,
        updated_at: new Date().toISOString(),
      };

      if (promoter_id) updateData.promoter_id = promoter_id;
      if (first_party_id) updateData.client_id = first_party_id;  // first_party is client
      if (second_party_id) updateData.employer_id = second_party_id;  // second_party is employer

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

      console.log('✅ Contract updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Contract updated successfully',
        contract_id: (updatedContract as any).id,
        contract_number: (updatedContract as any).contract_number,
        status: 'updated',
        template_id: '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0',
        // Image placeholders for Make.com Module 56
        image_placeholders: {
          promoter_id_card_image: {
            placeholder: '{{promoter_id_card_image}}',
            url: body.promoter_id_card_url || '', // Will be empty if not provided
            alt_text: 'ID Card'
          },
          promoter_passport_image: {
            placeholder: '{{promoter_passport_image}}',
            url: body.promoter_passport_url || '', // Will be empty if not provided
            alt_text: 'Passport'
          }
        }
      });
    }

    // Create new contract
    console.log('🆕 Creating new contract');
    
    const contractData: any = {
      contract_type,
      contract_number: finalContractNumber,
      title: `${contract_type} Contract - ${finalContractNumber}`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (promoter_id) contractData.promoter_id = promoter_id;
    if (first_party_id) contractData.client_id = first_party_id;  // first_party is client
    if (second_party_id) contractData.employer_id = second_party_id;  // second_party is employer
    
    // Map date fields from webhook data
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
    }
    
    // Map other fields
    if (body.job_title) contractData.title = `${body.job_title} - ${contract_type} Contract - ${finalContractNumber}`;
    if (body.basic_salary) contractData.value = parseFloat(body.basic_salary);
    if (body.special_terms) contractData.terms = body.special_terms;

    const { data: newContract, error: createError } = await (supabase as any)
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating contract:', createError);
      console.error('❌ Contract data that failed:', contractData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create contract',
          details: createError.message,
          contract_data: contractData,
          domain: "protal.thesmartpro.io"
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract created successfully');
    return NextResponse.json({
      success: true,
      message: 'Contract created successfully',
      contract_id: (newContract as any).id,
      contract_number: (newContract as any).contract_number,
      status: 'created',
      template_id: '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0',
      // Image placeholders for Make.com Module 56
      image_placeholders: {
        promoter_id_card_image: {
          placeholder: '{{promoter_id_card_image}}',
          url: body.promoter_id_card_url || '', // Will be empty if not provided
          alt_text: 'ID Card'
        },
        promoter_passport_image: {
          placeholder: '{{promoter_passport_image}}',
          url: body.promoter_passport_url || '', // Will be empty if not provided
          alt_text: 'Passport'
        }
      }
    });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        domain: "protal.thesmartpro.io"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Make.com Simple Webhook Endpoint',
    status: 'active',
    usage: 'Send POST requests with contract data',
    required_headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': 'Your webhook secret'
    },
    required_fields: {
      contract_type: 'string (required)',
      contract_id: 'string (optional)',
      contract_number: 'string (optional)',
      promoter_id: 'string (optional)',
      first_party_id: 'string (optional)',
      second_party_id: 'string (optional)'
    }
  });
}
