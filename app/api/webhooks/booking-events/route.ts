import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendToMakeWebhookWithRetry, updateWebhookStats } from '@/lib/webhooks/make-integration'
import type { BookingEventPayload } from '@/lib/realtime/booking-subscriptions'

import { verifyWebhook } from '@/lib/webhooks/verify'

// This API route can be triggered by Supabase Edge Functions or database triggers
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const rawBody = await request.text();
    
    const verification = await verifyWebhook({
      rawBody,
      signature: request.headers.get('x-signature') || '',
      timestamp: request.headers.get('x-timestamp') || '',
      idempotencyKey: request.headers.get('x-idempotency-key') || '',
      secret: process.env.SUPABASE_WEBHOOK_SECRET || ''
    });
    
    if (!verification.verified) {
      console.warn('❌ Invalid webhook request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (verification.idempotent) {
      console.log('🔄 Idempotent webhook - already processed');
      return NextResponse.json({ success: true, message: 'Already processed' });
    }
    
    const bookingEvent: BookingEventPayload = verification.payload.record || verification.payload;
    
    console.log('📨 Received booking event webhook:', {
      event_id: bookingEvent.id,
      event_type: bookingEvent.event_type,
      booking_id: bookingEvent.booking_id
    })
    
    // Validate the booking event
    if (!bookingEvent.id || !bookingEvent.booking_id || !bookingEvent.event_type) {
      return NextResponse.json({ 
        error: 'Invalid booking event payload' 
      }, { status: 400 })
    }

    // Fetch additional booking context for Make.com
    const startTime = Date.now()
    const additionalData = await fetchBookingContext(supabase, bookingEvent.booking_id)
    
    // Send to Make.com webhook with retry logic
    const result = await sendToMakeWebhookWithRetry(bookingEvent, additionalData)
    const responseTime = Date.now() - startTime
    
    // Update statistics
    updateWebhookStats(result.success, responseTime, result.error)
    
    if (result.success) {
      // Record the successful processing for idempotency
      await supabase.from('tracking_events').insert({
        actor_user_id: null,
        subject_type: 'webhook',
        subject_id: bookingEvent.booking_id,
        event_type: 'webhook_processed',
        metadata: { webhook_type: 'booking_event' },
        idempotency_key: request.headers.get('x-idempotency-key') || ''
      });
    
      console.log(`✅ Booking event forwarded to Make.com successfully (${result.attempts} attempts)`)
      return NextResponse.json({ 
        success: true,
        event_id: bookingEvent.id,
        attempts: result.attempts,
        response_time: responseTime
      })
    } else {
      console.error(`❌ Failed to forward booking event to Make.com:`, result.error)
      return NextResponse.json({ 
        success: false,
        error: result.error,
        attempts: result.attempts
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Booking event webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

// GET endpoint for webhook health check
export async function GET() {
  const { validateMakeWebhookConfig, getWebhookStats } = await import('@/lib/webhooks/make-integration')
  
  const validation = validateMakeWebhookConfig()
  const stats = getWebhookStats()
  
  return NextResponse.json({
    status: 'healthy',
    webhook_configured: validation.isValid,
    configuration_issues: validation.errors,
    configuration_warnings: validation.warnings,
    statistics: stats,
    timestamp: new Date().toISOString()
  })
}

/**
 * Fetch additional context for the booking event to send to Make.com
 */
async function fetchBookingContext(supabase: any, bookingId: string) {
  try {
    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        client_id,
        provider_id,
        service_id,
        status,
        scheduled_start,
        scheduled_end,
        total_price,
        currency,
        client_notes,
        provider_notes,
        client:users!client_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        provider:users!provider_id (
          id,
          full_name,
          email,
          avatar_url,
          companies (
            name,
            email,
            website
          )
        ),
        service:provider_services (
          id,
          name,
          category,
          price_base,
          duration_minutes
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.warn(`⚠️ Could not fetch booking context for ${bookingId}:`, bookingError)
      return {}
    }

    // Transform the data for Make.com
    return {
      booking_details: {
        id: booking.id,
        booking_number: booking.booking_number,
        client_id: booking.client_id,
        provider_id: booking.provider_id,
        service_id: booking.service_id,
        status: booking.status,
        scheduled_start: booking.scheduled_start,
        scheduled_end: booking.scheduled_end,
        total_price: booking.total_price,
        currency: booking.currency
      },
      client_info: booking.client ? {
        id: booking.client.id,
        name: booking.client.full_name,
        email: booking.client.email,
        avatar_url: booking.client.avatar_url
      } : undefined,
      provider_info: booking.provider ? {
        id: booking.provider.id,
        name: booking.provider.full_name,
        email: booking.provider.email,
        avatar_url: booking.provider.avatar_url,
        company_name: booking.provider.companies?.name,
        company_email: booking.provider.companies?.email,
        company_website: booking.provider.companies?.website
      } : undefined,
      service_info: booking.service ? {
        id: booking.service.id,
        name: booking.service.name,
        category: booking.service.category,
        price_base: booking.service.price_base,
        duration_minutes: booking.service.duration_minutes
      } : undefined
    }

  } catch (error) {
    console.error('❌ Error fetching booking context:', error)
    return {}
  }
}