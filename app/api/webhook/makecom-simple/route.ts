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
    let contract;
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

    if (finalContractNumber) {
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
      contract_number: finalContractNumber,
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
      status: 'created',
      template_id: '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0'
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
