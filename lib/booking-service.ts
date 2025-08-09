import { createClient } from '@supabase/supabase-js'

export interface BookingPayload {
  service_id: string
  provider_company_id: string
  client_id: string
  scheduled_start: string
  scheduled_end: string
  total_price: number
  currency: string
  booking_number: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded'
  notes?: string
  metadata?: Record<string, any>
  
  // Backward compatibility fields (will be auto-calculated by trigger)
  scheduled_at?: string
  duration_minutes?: number
}

export interface BookingResult {
  id: string
  booking_number: string
  status: string
  created_at?: string
  updated_at?: string
}

/**
 * Upsert a booking using booking_number as the conflict target
 * This allows updating existing bookings or creating new ones seamlessly
 */
export async function upsertBooking(payload: BookingPayload): Promise<BookingResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    console.log('🔄 Upserting booking:', payload.booking_number)
    
    // Validate required fields
    if (!payload.booking_number) {
      throw new Error('booking_number is required for upsert operations')
    }
    
    if (!payload.service_id || !payload.provider_company_id || !payload.client_id) {
      throw new Error('service_id, provider_company_id, and client_id are required')
    }
    
    // Ensure we have the required unique constraint field
    const cleanPayload = {
      ...payload,
      // Ensure metadata is valid JSON
      metadata: payload.metadata || {}
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .upsert(cleanPayload, { 
        onConflict: 'booking_number', 
        ignoreDuplicates: false 
      })
      .select('id, booking_number, status, scheduled_start, scheduled_end, created_at, updated_at')
      .single()

    if (error) {
      console.error('❌ Booking upsert error:', error)
      
      // Provide helpful error messages for common issues
      if (error.message.includes('unique constraint') || error.message.includes('booking_number')) {
        throw new Error(`Booking number conflict: ${error.message}. The unique constraint on booking_number may be missing.`)
      }
      
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        throw new Error(`Invalid reference: ${error.message}. Check that service_id, provider_company_id, and client_id exist.`)
      }
      
      throw new Error(`Failed to upsert booking: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from booking upsert')
    }

    console.log('✅ Booking upserted successfully:', data.booking_number)
    return data
  } catch (error) {
    console.error('❌ Booking service error:', error)
    throw error instanceof Error ? error : new Error('Unknown booking upsert error')
  }
}

/**
 * Generate a unique booking number
 * Format: BK-YYYY-XXXXXXXX (where X is random alphanumeric)
 */
export function generateBookingNumber(): string {
  const year = new Date().getFullYear()
  const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `BK-${year}-${randomSuffix}`
}

/**
 * Create a booking payload with default values
 */
export function createBookingPayload(
  overrides: Partial<BookingPayload> & Pick<BookingPayload, 'service_id' | 'provider_company_id' | 'client_id'>
): BookingPayload {
  const now = new Date()
  const scheduledStart = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
  const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration

  return {
    scheduled_start: scheduledStart.toISOString(),
    scheduled_end: scheduledEnd.toISOString(),
    total_price: 25.000,
    currency: 'OMR',
    booking_number: generateBookingNumber(),
    status: 'pending',
    ...overrides
  }
}

/**
 * Bulk upsert multiple bookings
 */
export async function upsertBookings(bookings: BookingPayload[]): Promise<BookingResult[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    console.log(`🔄 Bulk upserting ${bookings.length} bookings`)
    
    const { data, error } = await supabase
      .from('bookings')
      .upsert(bookings, { 
        onConflict: 'booking_number', 
        ignoreDuplicates: false 
      })
      .select('id, booking_number, status, created_at, updated_at')

    if (error) {
      console.error('❌ Bulk booking upsert error:', error)
      throw new Error(`Failed to bulk upsert bookings: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from bulk booking upsert')
    }

    console.log(`✅ ${data.length} bookings upserted successfully`)
    return data
  } catch (error) {
    console.error('❌ Bulk booking service error:', error)
    throw error instanceof Error ? error : new Error('Unknown bulk booking upsert error')
  }
}

/**
 * Get booking by booking number
 */
export async function getBookingByNumber(bookingNumber: string): Promise<BookingResult | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_number, status, created_at, updated_at')
      .eq('booking_number', bookingNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      throw new Error(`Failed to get booking: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('❌ Get booking error:', error)
    throw error instanceof Error ? error : new Error('Unknown get booking error')
  }
}