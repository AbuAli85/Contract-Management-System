/**
 * WhatsApp Status Callback Webhook
 *
 * Handles delivery status updates from Twilio
 * Configure this URL in Twilio Console as "Status callback URL"
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/webhooks/whatsapp/status - Handle message status updates
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Twilio sends status updates
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string; // queued, sent, delivered, failed, etc.
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const errorCode = formData.get('ErrorCode') as string;
    const errorMessage = formData.get('ErrorMessage') as string;


    // Update message status in database (if you're tracking messages)
    const supabase = await createClient();

    // You can create a whatsapp_messages table to track status
    // For now, we'll just log it
    try {
      // Example: Update notification status if tracking
      // await supabase
      //   .from('whatsapp_messages')
      //   .update({ status: messageStatus, updated_at: new Date().toISOString() })
      //   .eq('message_sid', messageSid);
    } catch (error) {
    }

    // Handle different statuses
    switch (messageStatus) {
      case 'delivered':
        break;
      case 'failed':
        // You might want to:
        // - Retry sending
        // - Notify admin
        // - Update user record
        break;
      case 'sent':
        break;
      case 'queued':
        break;
      default:
    }

    return NextResponse.json({
      success: true,
      message: 'Status received',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/whatsapp/status - Status endpoint check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'WhatsApp status callback webhook is active',
  });
}
