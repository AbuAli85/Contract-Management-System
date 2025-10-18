import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contractGenerationService } from '@/lib/contract-generation-service';
import { verifyWebhook } from '@/lib/webhooks/verify';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 PDF Ready webhook received');

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify HMAC signature and idempotency if secret is configured
    let body: any;
    const secret = process.env.PDF_READY_WEBHOOK_SECRET || '';
    if (secret) {
      const verification = await verifyWebhook({
        rawBody,
        signature: request.headers.get('x-signature') || '',
        timestamp: request.headers.get('x-timestamp') || '',
        idempotencyKey: request.headers.get('x-idempotency-key') || '',
        secret,
      });

      if (!verification.verified) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (verification.idempotent) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      body = verification.payload;
    } else {
      // Fallback to parsing JSON directly when no secret is set
      body = JSON.parse(rawBody || '{}');
    }

    console.log('📄 Webhook payload:', body);

    // Validate required fields
    const { contract_id, contract_number, pdf_url, google_drive_url, status } =
      body;

    if (!contract_id && !contract_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_id or contract_number is required',
        },
        { status: 400 }
      );
    }

    if (!pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'pdf_url is required',
        },
        { status: 400 }
      );
    }

    // Update contract with PDF URL
    const success = await contractGenerationService.updateContractWithPDF(
      contract_id || contract_number,
      pdf_url,
      google_drive_url
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update contract',
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract updated with PDF URL:', pdf_url);

    // Record processed event for idempotency tracking/audit
    try {
      const supabase = await createClient();
      await supabase.from('tracking_events').insert({
        actor_user_id: null,
        subject_type: 'webhook',
        subject_id: contract_id || contract_number || null,
        event_type: 'webhook_processed',
        metadata: { webhook_type: 'pdf_ready' },
        idempotency_key: request.headers.get('x-idempotency-key') || '',
      });
    } catch (e) {
      console.warn('⚠️ Failed to record tracking event for PDF Ready webhook');
    }

    // Send success response
    return NextResponse.json({
      success: true,
      message: 'Contract updated successfully',
      contract_id: contract_id || contract_number,
      pdf_url,
      status: status || 'generated',
    });
  } catch (error) {
    console.error('❌ PDF Ready webhook error:', error);
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

export async function PATCH(request: NextRequest) {
  try {
    console.log('📄 PDF Ready webhook received (PATCH)');

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify HMAC signature and idempotency if secret is configured
    let body: any;
    const secret = process.env.PDF_READY_WEBHOOK_SECRET || '';
    if (secret) {
      const verification = await verifyWebhook({
        rawBody,
        signature: request.headers.get('x-signature') || '',
        timestamp: request.headers.get('x-timestamp') || '',
        idempotencyKey: request.headers.get('x-idempotency-key') || '',
        secret,
      });

      if (!verification.verified) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (verification.idempotent) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      body = verification.payload;
    } else {
      // Fallback to parsing JSON directly when no secret is set
      body = JSON.parse(rawBody || '{}');
    }

    console.log('📄 Webhook payload (PATCH):', body);

    // Validate required fields
    const { contract_id, contract_number, pdf_url, google_drive_url, status } =
      body;

    if (!contract_id && !contract_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_id or contract_number is required',
        },
        { status: 400 }
      );
    }

    if (!pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'pdf_url is required',
        },
        { status: 400 }
      );
    }

    // Update contract with PDF URL
    const success = await contractGenerationService.updateContractWithPDF(
      contract_id || contract_number,
      pdf_url,
      google_drive_url
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update contract',
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract updated with PDF URL (PATCH):', pdf_url);

    // Record processed event for idempotency tracking/audit
    try {
      const supabase = await createClient();
      await supabase.from('tracking_events').insert({
        actor_user_id: null,
        subject_type: 'webhook',
        subject_id: contract_id || contract_number || null,
        event_type: 'webhook_processed',
        metadata: { webhook_type: 'pdf_ready_patch' },
        idempotency_key: request.headers.get('x-idempotency-key') || '',
      });
    } catch (e) {
      console.warn('⚠️ Failed to record tracking event for PDF Ready webhook (PATCH)');
    }

    // Send success response
    return NextResponse.json({
      success: true,
      message: 'Contract updated successfully',
      contract_id: contract_id || contract_number,
      pdf_url,
      status: status || 'generated',
    });
  } catch (error) {
    console.error('❌ PDF Ready webhook error (PATCH):', error);
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

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'PDF Ready webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
