import { NextResponse } from 'next/server'
import { upsertBooking, createBookingPayload } from '@/lib/booking-service'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🧪 Testing booking upsert functionality...')

    // Create a test payload
    const testPayload = createBookingPayload({
      service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
      provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
      client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
      booking_number: 'BK-API-TEST-' + Date.now(),
      total_price: 99.99,
      currency: 'OMR',
      notes: 'API test booking'
    })

    console.log('📋 Test payload:', testPayload)

    // Test the upsert
    const result = await upsertBooking(testPayload)

    console.log('✅ Upsert successful:', result)

    // Clean up - delete the test booking
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase
      .from('bookings')
      .delete()
      .eq('id', result.id)

    console.log('🧹 Test data cleaned up')

    return NextResponse.json({
      success: true,
      message: 'Booking upsert test completed successfully',
      result,
      test_payload: testPayload,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Booking upsert test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Booking upsert test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}