import { NextRequest, NextResponse } from 'next/server'
import { dispatchWebhook } from '@/lib/makeWebhooks'
import { WebhookTypeSchema } from '@/lib/schemas/webhooks'
import { 
  ServiceCreatedSchema, 
  BookingCreatedSchema, 
  TrackingUpdatedSchema, 
  PaymentSucceededSchema 
} from '@/lib/schemas/webhooks'

import { verifyWebhook } from '@/lib/webhooks/verify'
import { createClient } from '@/lib/supabase/server'

const schemaMap = {
  serviceCreation: ServiceCreatedSchema,
  bookingCreated: BookingCreatedSchema,
  trackingUpdated: TrackingUpdatedSchema,
  paymentSucceeded: PaymentSucceededSchema,
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const rawBody = await request.text();

    const verification = await verifyWebhook({
      rawBody,
      signature: request.headers.get('x-signature') || '',
      timestamp: request.headers.get('x-timestamp') || '',
      idempotencyKey: request.headers.get('x-idempotency-key') || '',
      secret: process.env.WEBHOOK_SECRET || ''
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (verification.idempotent) {
      return NextResponse.json({ success: true });
    }

    const body = verification.payload;

    const supabase = createClient();

    // Validate webhook type
    const typeResult = WebhookTypeSchema.safeParse(params.type)
    if (!typeResult.success) {
      return NextResponse.json(
        { error: 'Invalid webhook type' },
        { status: 400 }
      )
    }

    const webhookType = typeResult.data

    // Parse and validate request body
    const schema = schemaMap[webhookType]
    const validationResult = schema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid payload',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    // Dispatch webhook
    const result = await dispatchWebhook(webhookType, validationResult.data)

    if (result.success) {
      await supabase.from('tracking_events').insert({
        actor_user_id: null,
        subject_type: webhookType,
        subject_id: null,
        event_type: 'webhook_processed',
        metadata: { type: webhookType },
        idempotency_key: request.headers.get('x-idempotency-key') || ''
      });

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Webhook API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
} 