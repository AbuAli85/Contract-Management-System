import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Support multiple webhook secret environment variable names
const PDF_WEBHOOK_SECRET = 
  process.env.PDF_WEBHOOK_SECRET || 
  process.env.MAKE_WEBHOOK_SECRET ||
  process.env.MAKECOM_WEBHOOK_SECRET;

// Create Supabase service client for webhook (doesn't need cookies)
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

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
    const supabase = createServiceClient();

    // 5. Verify contract exists
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, contract_number, user_id')
      .eq('id', payload.contract_id)
      .single();

    if (fetchError || !contract) {
      console.error('Contract not found:', payload.contract_id);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // 6. Update contract in database (only update columns that exist)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (payload.status === 'generated') {
      updateData.pdf_url = payload.pdf_url;
      updateData.google_doc_url = payload.google_drive_url; // Map to existing column
      // Note: pdf_generated_at, pdf_status, pdf_error_message don't exist in schema
      // Store status info in notes if needed for audit trail
      const statusNote = `PDF generated at ${new Date().toISOString()}. Images processed: ${JSON.stringify(payload.images_processed || {})}`;
      updateData.notes = statusNote;
    } else if (payload.status === 'error') {
      // Store error in notes since pdf_error_message column doesn't exist
      const errorNote = `PDF generation failed at ${new Date().toISOString()}: ${payload.error_message || 'Unknown error'}`;
      updateData.notes = errorNote;
    }

    console.log('Updating contract with data:', updateData);

    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', payload.contract_id);

    if (updateError) {
      console.error('Failed to update contract:', updateError);
      return NextResponse.json(
        { 
          error: 'Failed to update contract',
          details: updateError.message,
          hint: updateError.hint 
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract updated successfully:', payload.contract_id);

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
    if (payload.status === 'generated' && contract.user_id) {
      try {
        await sendNotification({
          userId: contract.user_id,
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
  try {
    const supabase = createServiceClient();
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to create notification:', error);
  }
}

// Also support POST for compatibility
export const POST = PATCH;
