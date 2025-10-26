import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const PDF_WEBHOOK_SECRET = process.env.PDF_WEBHOOK_SECRET;

interface PDFReadyPayload {
  contract_id: string;
  contract_number: string;
  pdf_url: string;
  google_drive_url: string;
  status: 'generated' | 'error';
  images_processed?: {
    id_card: boolean;
    passport: boolean;
  };
  error_message?: string;
}

export async function PATCH(request: Request) {
  try {
    // 1. Verify webhook secret
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    const requestId = request.headers.get('X-Make-Request-ID');

    if (!PDF_WEBHOOK_SECRET) {
      console.error('PDF_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (webhookSecret !== PDF_WEBHOOK_SECRET) {
      console.warn('Invalid webhook secret received');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid webhook secret' },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const payload: PDFReadyPayload = await request.json();

    console.log('PDF Ready webhook received:', {
      contractId: payload.contract_id,
      contractNumber: payload.contract_number,
      status: payload.status,
      requestId,
    });

    // 3. Validate payload
    if (!payload.contract_id) {
      return NextResponse.json(
        { error: 'Missing contract_id in payload' },
        { status: 400 }
      );
    }

    if (!payload.contract_number) {
      return NextResponse.json(
        { error: 'Missing contract_number in payload' },
        { status: 400 }
      );
    }

    // 4. Create Supabase client (service role for webhook)
    const supabase = await createClient();

    // 5. Verify contract exists
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, contract_number, created_by')
      .eq('id', payload.contract_id)
      .single();

    if (fetchError || !contract) {
      console.error('Contract not found:', payload.contract_id);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // 6. Update contract in database
    const updateData: any = {
      pdf_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (payload.status === 'generated') {
      updateData.pdf_url = payload.pdf_url;
      updateData.google_drive_url = payload.google_drive_url;
      updateData.pdf_status = 'generated';
      updateData.pdf_error_message = null;
    } else if (payload.status === 'error') {
      updateData.pdf_status = 'error';
      updateData.pdf_error_message = payload.error_message || 'PDF generation failed';
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', payload.contract_id);

    if (updateError) {
      console.error('Failed to update contract:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contract' },
        { status: 500 }
      );
    }

    // 7. Log the webhook event for audit trail
    try {
      await supabase.from('webhook_logs').insert({
        event_type: 'contract_pdf_ready',
        payload: payload,
        contract_id: payload.contract_id,
        status: payload.status,
        make_request_id: requestId,
        received_at: new Date().toISOString(),
      });
    } catch (logError) {
      // Non-critical - just log
      console.warn('Failed to log webhook event:', logError);
    }

    // 8. Send notification to user (optional - if you have notification system)
    if (payload.status === 'generated' && contract.created_by) {
      try {
        await sendNotification({
          userId: contract.created_by,
          type: 'contract_pdf_ready',
          title: 'Contract PDF Ready',
          message: `PDF for contract ${payload.contract_number} is ready to download`,
          data: {
            contractId: payload.contract_id,
            contractNumber: payload.contract_number,
            pdfUrl: payload.pdf_url,
          },
        });
      } catch (notificationError) {
        // Non-critical error - just log
        console.warn('Failed to send notification:', notificationError);
      }
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      contract_id: payload.contract_id,
      contract_number: payload.contract_number,
      status: payload.status,
      updated_at: updateData.updated_at,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to send notification (implement based on your notification system)
async function sendNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  // Implementation depends on your notification system
  // Could be:
  // - Database notification table
  // - Push notification service
  // - Email notification
  // - WebSocket real-time notification
  
  console.log('Notification:', params);
  
  // Example: Store in database
  const supabase = await createClient();
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data,
    read: false,
    created_at: new Date().toISOString(),
  });
}

// Also support POST for compatibility
export const POST = PATCH;
