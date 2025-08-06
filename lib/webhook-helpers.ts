// lib/webhook-helpers.ts
/**
 * Helper functions for triggering Make.com webhooks
 */

export interface WebhookTriggerOptions {
  event: string
  data: any
  retries?: number
  delay?: number
}

export interface WebhookResponse {
  success: boolean
  error?: string
  details?: any
  timestamp: string
}

/**
 * Trigger a webhook with the specified event and data
 */
export async function triggerWebhook(options: WebhookTriggerOptions): Promise<WebhookResponse> {
  const { event, data, retries = 3, delay = 1000 } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Triggering webhook (attempt ${attempt}/${retries}):`, event)

      const response = await fetch('/api/bookings/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          ...data,
          attempt,
          max_retries: retries
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Webhook triggered successfully:`, event)
        return {
          success: true,
          details: result,
          timestamp: new Date().toISOString()
        }
      } else {
        const errorText = await response.text()
        console.error(`❌ Webhook failed (attempt ${attempt}):`, errorText)
        
        if (attempt === retries) {
          return {
            success: false,
            error: `Webhook failed after ${retries} attempts`,
            details: errorText,
            timestamp: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      console.error(`❌ Webhook error (attempt ${attempt}):`, error)
      
      if (attempt === retries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }
    }

    // Wait before retrying
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  return {
    success: false,
    error: 'Maximum retries exceeded',
    timestamp: new Date().toISOString()
  }
}

/**
 * Trigger booking created webhook
 */
export async function triggerBookingCreatedWebhook(booking: any): Promise<WebhookResponse> {
  return triggerWebhook({
    event: 'booking.created',
    data: {
      booking_id: booking.id,
      booking_number: booking.booking_number,
      service_id: booking.service_id,
      client_id: booking.client_id,
      provider_id: booking.provider_id,
      client_email: booking.client_email,
      client_name: booking.client_name,
      scheduled_start: booking.scheduled_start,
      scheduled_end: booking.scheduled_end,
      quoted_price: booking.quoted_price,
      status: booking.status,
      created_at: booking.created_at
    }
  })
}

/**
 * Trigger booking status change webhook
 */
export async function triggerBookingStatusChangeWebhook(
  booking: any,
  oldStatus: string,
  newStatus: string
): Promise<WebhookResponse> {
  return triggerWebhook({
    event: 'booking.status_changed',
    data: {
      booking_id: booking.id,
      booking_number: booking.booking_number,
      old_status: oldStatus,
      new_status: newStatus,
      client_email: booking.client_email,
      provider_id: booking.provider_id,
      service_id: booking.service_id,
      updated_at: new Date().toISOString()
    }
  })
}

/**
 * Trigger service created webhook
 */
export async function triggerServiceCreatedWebhook(service: any): Promise<WebhookResponse> {
  return triggerWebhook({
    event: 'service.created',
    data: {
      service_id: service.id,
      provider_id: service.provider_id,
      title: service.title,
      category: service.category,
      subcategory: service.subcategory,
      base_price: service.base_price,
      currency: service.currency,
      status: service.status,
      location_type: service.location_type,
      created_at: service.created_at
    }
  })
}

/**
 * Trigger user registration webhook
 */
export async function triggerUserRegistrationWebhook(user: any, profile: any): Promise<WebhookResponse> {
  return triggerWebhook({
    event: 'user.registered',
    data: {
      user_id: user.id,
      email: user.email,
      full_name: profile.full_name,
      role: profile.role,
      status: profile.status,
      company_name: profile.company_name,
      business_type: profile.business_type,
      created_at: profile.created_at
    }
  })
}

/**
 * Batch trigger multiple webhooks
 */
export async function triggerMultipleWebhooks(webhooks: WebhookTriggerOptions[]): Promise<WebhookResponse[]> {
  const results = await Promise.allSettled(
    webhooks.map(webhook => triggerWebhook(webhook))
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      console.error(`Webhook ${index} failed:`, result.reason)
      return {
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  })
}
