/**
 * WhatsApp Webhook Handler
 *
 * Handles incoming WhatsApp messages from Twilio
 * Configure this URL in Twilio Console: https://yourdomain.com/api/webhooks/whatsapp
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/webhooks/whatsapp - Handle incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Twilio sends form data
    const from = formData.get('From') as string; // whatsapp:+96879665522
    const to = formData.get('To') as string; // whatsapp:+14155238886
    const body = formData.get('Body') as string; // Message content
    const messageSid = formData.get('MessageSid') as string;
    const accountSid = formData.get('AccountSid') as string;
    const numMedia = formData.get('NumMedia') as string;


    // Extract phone number (remove whatsapp: prefix)
    const phoneNumber = from?.replace('whatsapp:', '') || '';

    if (!phoneNumber || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find promoter/profile by phone number
    const supabase = await createClient();

    // Try to find in promoters table
    const { data: promoter } = await supabase
      .from('promoters')
      .select('id, name_en, email, phone, mobile_number')
      .or(`phone.eq.${phoneNumber},mobile_number.eq.${phoneNumber}`)
      .single();

    // Try to find in profiles table
    let profile = null;
    if (!promoter) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, phone_number, full_name')
        .eq('phone_number', phoneNumber)
        .single();
      profile = profileData;
    }

    // Store incoming message in database (optional - create notifications table if needed)
    try {
      // You can create a whatsapp_messages table to log all conversations
      // For now, we'll just log to console and handle commands
    } catch (error) {
    }

    // Handle commands
    const message = body.trim().toLowerCase();
    let responseMessage = '';

    if (message === 'stop' || message === 'unsubscribe') {
      // Handle unsubscribe
      responseMessage =
        'You have been unsubscribed from notifications. Reply START to subscribe again.';
    } else if (message === 'start' || message === 'subscribe') {
      // Handle subscribe
      responseMessage = 'You are now subscribed to notifications. Thank you!';
    } else if (message === 'help' || message === 'info') {
      // Show help
      responseMessage = `Welcome! Available commands:
• HELP - Show this message
• STOP - Unsubscribe from notifications
• START - Subscribe to notifications
• STATUS - Check your account status`;
    } else if (message === 'status') {
      // Show user status
      const userName = promoter?.name_en || profile?.full_name || 'User';
      const userStatus = promoter?.status || 'active';
      responseMessage = `Hello ${userName}! Your account is ${userStatus}.`;
    } else if (message.startsWith('join ')) {
      // Handle sandbox join (already handled by Twilio, but acknowledge)
      responseMessage =
        'Welcome to the WhatsApp Sandbox! You are now connected.';
    } else {
      // Default response - acknowledge receipt
      responseMessage = `Thank you for your message: "${body}". Our team will respond shortly. For help, reply HELP.`;

      // You can add custom logic here:
      // - Route to support team
      // - Process orders/requests
      // - Trigger workflows
      // - etc.
    }

    // Send response via TwiML (Twilio Markup Language)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {

    // Return empty TwiML response to avoid Twilio retries
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, we encountered an error processing your message.</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

/**
 * GET /api/webhooks/whatsapp - Webhook verification (if needed)
 */
export async function GET(request: NextRequest) {
  // Twilio may send GET requests for webhook verification
  return NextResponse.json({
    status: 'ok',
    message: 'WhatsApp webhook is active',
  });
}
