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

    if (!contract_id && !contract_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_id or contract_number is required',
        },
        { status: 400 }
      );
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
    let contract;
    if (contract_id) {
      const { data: existingContract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
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

    if (contract_number) {
      const { data: existingContract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_number', contract_number)
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
      console.log('📝 Updating existing contract:', contract.id);
      
      const updateData: any = {
        contract_type,
        updated_at: new Date().toISOString(),
      };

      if (promoter_id) updateData.promoter_id = promoter_id;
      if (first_party_id) updateData.first_party_id = first_party_id;
      if (second_party_id) updateData.second_party_id = second_party_id;

      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contract.id)
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
        contract_id: updatedContract.id,
        contract_number: updatedContract.contract_number,
        status: 'updated'
      });
    }

    // Create new contract
    console.log('🆕 Creating new contract');
    
    const contractData: any = {
      contract_type,
      contract_number: contract_number || `CONTRACT-${Date.now()}`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (promoter_id) contractData.promoter_id = promoter_id;
    if (first_party_id) contractData.first_party_id = first_party_id;
    if (second_party_id) contractData.second_party_id = second_party_id;

    const { data: newContract, error: createError } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating contract:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create contract' },
        { status: 500 }
      );
    }

    console.log('✅ Contract created successfully');
    return NextResponse.json({
      success: true,
      message: 'Contract created successfully',
      contract_id: newContract.id,
      contract_number: newContract.contract_number,
      status: 'created'
    });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
