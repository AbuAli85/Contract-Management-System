import { NextRequest, NextResponse } from 'next/server'
import { dispatchWebhook } from '@/lib/makeWebhooks'
import { WebhookTypeSchema } from '@/lib/schemas/webhooks'
import { 
  ServiceCreatedSchema, 
  BookingCreatedSchema, 
  TrackingUpdatedSchema, 
  PaymentSucceededSchema 
} from '@/lib/schemas/webhooks'

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
    const body = await request.json()
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