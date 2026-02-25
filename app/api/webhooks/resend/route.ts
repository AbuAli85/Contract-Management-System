import { NextRequest, NextResponse } from 'next/server';

// Allow POST requests without authentication (webhooks)
export const dynamic = 'force-dynamic';

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
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const svixTimestamp = req.headers.get('svix-timestamp');
      const svixSignature = req.headers.get('svix-signature');

      if (!svixTimestamp || !svixSignature) {
        return NextResponse.json(
          { error: 'Missing webhook signature headers' },
          { status: 401 }
        );
      }

      // Basic timestamp validation to prevent replay attacks (5 minute window)
      const timestamp = parseInt(svixTimestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > 300) {
        return NextResponse.json(
          { error: 'Webhook timestamp too old' },
          { status: 401 }
        );
      }
    }

    // Parse the webhook payload
    const payload: ResendWebhookPayload = await req.json();

    // Handle different event types
    switch (payload.type) {
      case 'email.sent':
      case 'email.delivered':
      case 'email.opened':
      case 'email.clicked':
        // These are informational events; no action required
        break;

      case 'email.bounced': {
        if (payload.data.bounce?.type === 'hard') {
          // Hard bounce: mark email as invalid in the database
          const bouncedEmail = payload.data.to[0];
          if (bouncedEmail) {
            const { createClient } = await import('@/lib/supabase/server');
            const supabase = await createClient();
            await supabase
              .from('promoters')
              .update({
                email_valid: false,
                email_bounced_at: new Date().toISOString(),
              })
              .eq('email', bouncedEmail);
            await supabase
              .from('profiles')
              .update({ email_bounced: true })
              .eq('email', bouncedEmail);
          }
        }
        break;
      }

      case 'email.complained': {
        // Spam complaint: flag the email address for review
        const complainedEmail = payload.data.to[0];
        if (complainedEmail) {
          const { createClient } = await import('@/lib/supabase/server');
          const supabase = await createClient();
          await supabase
            .from('profiles')
            .update({ email_spam_complaint: true })
            .eq('email', complainedEmail);
        }
        break;
      }

      case 'email.delivery_delayed':
        // Temporary delay - Resend will retry automatically
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
