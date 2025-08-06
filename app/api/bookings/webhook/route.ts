import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

interface WebhookPayload {
  event: string
  booking_id?: string
  booking_number?: string
  service_id?: string
  client_id?: string
  provider_id?: string
  client_email?: string
  client_name?: string
  scheduled_start?: string
  scheduled_end?: string
  quoted_price?: number
  status?: string
  old_status?: string
  new_status?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

// Make.com webhook URLs mapping
const WEBHOOK_URLS = {
  'booking.created': process.env.MAKE_WEBHOOK_BOOKING_CREATED || 'https://hook.eu2.make.com/wb6i8h78k2uxwpq2qvd73lha0hs355ka',
  'booking.status_changed': process.env.MAKE_WEBHOOK_BOOKING_STATUS || 'https://hook.eu2.make.com/wb6i8h78k2uxwpq2qvd73lha0hs355ka',
  'service.created': process.env.MAKE_WEBHOOK_SERVICE_CREATED || 'https://hook.eu2.make.com/wb6i8h78k2uxwpq2qvd73lha0hs355ka',
  'user.registered': process.env.MAKE_WEBHOOK_USER_REGISTERED || 'https://hook.eu2.make.com/wb6i8h78k2uxwpq2qvd73lha0hs355ka'
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== BOOKING WEBHOOK HANDLER START ===")

    // Parse the request body
    const payload: WebhookPayload = await request.json()
    console.log("Webhook payload received:", payload)

    // Validate required fields
    if (!payload.event) {
      console.error("❌ Missing event type in payload")
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 })
    }

    // Get the appropriate webhook URL
    const webhookUrl = WEBHOOK_URLS[payload.event as keyof typeof WEBHOOK_URLS]
    if (!webhookUrl) {
      console.error(`❌ No webhook URL configured for event: ${payload.event}`)
      return NextResponse.json({ error: `Unsupported event type: ${payload.event}` }, { status: 400 })
    }

    // For booking events, enrich with additional data from Supabase
    let enrichedPayload = { ...payload }

    if (payload.event.startsWith('booking.') && payload.booking_id) {
      try {
        const supabase = createServerComponentClient({ cookies })

        // Get booking details with related data
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            service:services(
              id,
              title,
              category,
              subcategory,
              description,
              base_price,
              currency,
              location_type,
              provider_id
            ),
            client:profiles!client_id(
              id,
              full_name,
              display_name,
              email,
              phone,
              company_name
            ),
            provider:profiles!provider_id(
              id,
              full_name,
              display_name,
              email,
              phone,
              company_name,
              business_type
            )
          `)
          .eq('id', payload.booking_id)
          .single()

        if (!bookingError && bookingData) {
          enrichedPayload = {
            ...payload,
            booking: bookingData,
            service: bookingData.service,
            client: bookingData.client,
            provider: bookingData.provider,
            // Legacy fields for backward compatibility
            client_email: bookingData.client_email || bookingData.client?.email,
            client_name: bookingData.client_name || bookingData.client?.full_name,
            booking_number: bookingData.booking_number,
            scheduled_start: bookingData.scheduled_start,
            scheduled_end: bookingData.scheduled_end,
            quoted_price: bookingData.quoted_price,
            status: bookingData.status
          }
          console.log("✅ Enriched booking data successfully")
        } else {
          console.warn("⚠️ Could not enrich booking data:", bookingError)
        }
      } catch (enrichError) {
        console.warn("⚠️ Error enriching booking data:", enrichError)
        // Continue with original payload if enrichment fails
      }
    }

    // Add timestamp and metadata
    enrichedPayload.webhook_timestamp = new Date().toISOString()
    enrichedPayload.source = 'contract-management-system'
    enrichedPayload.environment = process.env.NODE_ENV || 'development'

    console.log("Sending to Make.com webhook:", webhookUrl)
    console.log("Enriched payload:", JSON.stringify(enrichedPayload, null, 2))

    // Send to Make.com webhook
    const makeResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ContractManagementSystem/1.0'
      },
      body: JSON.stringify(enrichedPayload)
    })

    if (!makeResponse.ok) {
      const errorText = await makeResponse.text()
      console.error(`❌ Make.com webhook failed (${makeResponse.status}):`, errorText)
      
      // Log the failure to database for monitoring
      try {
        const supabase = createServerComponentClient({ cookies })
        await supabase.from('webhook_logs').insert({
          webhook_type: payload.event,
          payload: enrichedPayload,
          status: 'error',
          error_message: `HTTP ${makeResponse.status}: ${errorText}`,
          created_at: new Date().toISOString()
        })
      } catch (logError) {
        console.error("Failed to log webhook error:", logError)
      }

      return NextResponse.json(
        { error: 'Failed to notify Make.com', details: errorText },
        { status: 502 }
      )
    }

    const makeResponseData = await makeResponse.text()
    console.log("✅ Make.com webhook response:", makeResponseData)

    // Log successful webhook execution
    try {
      const supabase = createServerComponentClient({ cookies })
      await supabase.from('webhook_logs').insert({
        webhook_type: payload.event,
        payload: enrichedPayload,
        response: makeResponseData ? JSON.parse(makeResponseData) : null,
        status: 'success',
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      console.log("✅ Webhook execution logged successfully")
    } catch (logError) {
      console.warn("⚠️ Failed to log webhook success:", logError)
    }

    console.log("=== BOOKING WEBHOOK HANDLER COMPLETE ===")

    return NextResponse.json({
      success: true,
      event: payload.event,
      webhook_url: webhookUrl,
      make_response: makeResponseData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("=== BOOKING WEBHOOK HANDLER ERROR ===")
    console.error("Unexpected error:", error)

    // Log the error to database
    try {
      const supabase = createServerComponentClient({ cookies })
      await supabase.from('webhook_logs').insert({
        webhook_type: 'unknown',
        payload: { error: 'Failed to parse request' },
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error("Failed to log general error:", logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET for webhook URL verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Contract Management System - Booking Webhook',
    status: 'active',
    supported_events: Object.keys(WEBHOOK_URLS),
    timestamp: new Date().toISOString()
  })
}
