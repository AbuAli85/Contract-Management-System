import { NextRequest, NextResponse } from 'next/server';

// Resend webhook event types
type ResendWebhookEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookPayload {
  type: ResendWebhookEvent;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Additional fields based on event type
    bounced_at?: string;
    opened_at?: string;
    clicked_at?: string;
    click?: {
      link: string;
      timestamp: string;
    };
    bounce?: {
      type: 'hard' | 'soft';
      message: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    // Parse the webhook payload
    const payload: ResendWebhookPayload = await req.json();

    console.log('📬 Resend webhook received:', payload.type);

    // TODO: Verify webhook signature for production
    // const signature = req.headers.get('svix-signature');
    // const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    // if (webhookSecret && signature) {
    //   // Verify with Svix library
    // }

    // Handle different event types
    switch (payload.type) {
      case 'email.sent':
        console.log('✅ Email sent:', payload.data.email_id);
        console.log('  To:', payload.data.to[0]);
        console.log('  Subject:', payload.data.subject);
        break;

      case 'email.delivered':
        console.log('📬 Email delivered:', payload.data.email_id);
        console.log('  To:', payload.data.to[0]);
        break;

      case 'email.opened':
        console.log('👁️ Email opened:', payload.data.email_id);
        console.log('  To:', payload.data.to[0]);
        console.log('  At:', payload.data.opened_at);
        break;

      case 'email.clicked':
        console.log('🖱️ Email link clicked:', payload.data.email_id);
        if (payload.data.click) {
          console.log('  Link:', payload.data.click.link);
          console.log('  At:', payload.data.click.timestamp);
        }
        break;

      case 'email.bounced':
        console.error('❌ Email bounced:', payload.data.email_id);
        console.error('  To:', payload.data.to[0]);
        if (payload.data.bounce) {
          console.error('  Type:', payload.data.bounce.type);
          console.error('  Message:', payload.data.bounce.message);

          // Handle hard bounces - mark email as invalid
          if (payload.data.bounce.type === 'hard') {
            console.error('🚨 HARD BOUNCE - Invalid email:', payload.data.to[0]);
            // TODO: Update database to mark email as invalid
            // const { createClient } = await import('@/lib/supabase/server');
            // const supabase = await createClient();
            // await supabase.from('promoters')
            //   .update({ email_valid: false, email_bounced: true })
            //   .eq('email', payload.data.to[0]);
          }
        }
        break;

      case 'email.complained':
        console.warn('⚠️ Email marked as spam:', payload.data.email_id);
        console.warn('  To:', payload.data.to[0]);
        // TODO: Handle spam complaints
        // Consider unsubscribing user or marking for review
        break;

      case 'email.delivery_delayed':
        console.warn('⏳ Email delivery delayed:', payload.data.email_id);
        console.warn('  To:', payload.data.to[0]);
        // Usually temporary, will retry automatically
        break;

      default:
        console.log('Unknown event type:', payload.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Allow POST requests without authentication (webhooks)
export const dynamic = 'force-dynamic';

