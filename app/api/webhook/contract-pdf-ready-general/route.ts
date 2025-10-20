import { NextRequest, NextResponse } from 'next/server';
import { generalContractService } from '@/lib/general-contract-service';

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔗 General Contract PDF Ready Webhook received');

    // Get the webhook secret from headers
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.PDF_WEBHOOK_SECRET;

    // Verify webhook secret
    if (!webhookSecret || !expectedSecret || webhookSecret !== expectedSecret) {
      console.log('❌ Webhook secret verification failed');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid webhook secret' },
        { status: 401 }
      );
    }

    console.log('✅ Webhook secret verified');

    // Parse the request body
    const body = await request.json();
    console.log('📤 PDF Ready payload:', body);

    // Validate required fields
    const { contract_id, contract_number, pdf_url, google_drive_url, status } = body;

    if (!contract_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_id is required',
        },
        { status: 400 }
      );
    }

    // Update contract with PDF results
    await generalContractService.updateContractWithMakeComResults(contract_id, {
      pdf_url,
      google_drive_url,
      status: 'completed', // Always use 'completed' which is a valid status
      images_processed: body.images_processed || {
        id_card: false,
        passport: false,
      },
    });

    console.log('✅ General contract updated with PDF results');

    return NextResponse.json({
      success: true,
      message: 'General contract updated successfully',
      contract_id,
      contract_number,
      status: 'completed',
    });

  } catch (error) {
    console.error('❌ General contract PDF ready webhook processing failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'General Contract PDF Ready Webhook Endpoint',
    status: 'active',
    usage: 'Send PATCH requests when general contract PDF is ready',
    required_headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': 'Your PDF webhook secret'
    },
    required_fields: {
      contract_id: 'string (required)',
      contract_number: 'string (optional)',
      pdf_url: 'string (optional)',
      google_drive_url: 'string (optional)',
      status: 'string (optional)'
    },
    optional_fields: {
      images_processed: 'object with id_card and passport boolean fields'
    }
  });
}
