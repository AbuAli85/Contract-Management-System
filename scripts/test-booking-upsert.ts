/**
 * Test script for booking upsert functionality
 * Run with: npx tsx scripts/test-booking-upsert.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BookingPayload {
  service_id: string
  provider_company_id: string
  client_id: string
  scheduled_start: string
  scheduled_end: string
  total_price: number
  currency: string
  booking_number: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded'
}

async function testBookingUpsert() {
  console.log('🧪 Testing Booking Upsert Functionality\n')

  // First, check schema readiness
  console.log('🔍 Checking database schema...')
  try {
    const schemaResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/debug/booking-schema`)
    const schemaData = await schemaResponse.json()
    
    console.log('📋 Schema Check Results:')
    console.log(JSON.stringify(schemaData.summary, null, 2))
    
    if (!schemaData.summary?.bookings_table_exists) {
      console.error('❌ Bookings table does not exist. Please run the migration first.')
      return
    }
    
    if (!schemaData.summary?.unique_constraint_exists) {
      console.warn('⚠️ Unique constraint on booking_number may be missing. Upsert may not work correctly.')
    }
  } catch (schemaError) {
    console.warn('⚠️ Could not check schema:', schemaError)
    console.log('Continuing with tests anyway...\n')
  }

  // Test payload (exactly as shown in your example)
  const payload: BookingPayload = {
    service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
    provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
    client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
    scheduled_start: new Date(Date.now() + 4*24*60*60*1000).toISOString(),
    scheduled_end: new Date(Date.now() + 4*24*60*60*1000 + 2*60*60*1000).toISOString(),
    total_price: 25.000,
    currency: 'OMR',
    booking_number: 'BK-TEST-0000000042',
    status: 'pending',
    metadata: { test_run: true, timestamp: new Date().toISOString() }
  }

  console.log('📋 Test Payload:')
  console.log(JSON.stringify(payload, null, 2))
  console.log()

  try {
    // Test 1: First upsert (should create new record)
    console.log('🔄 Test 1: First upsert (CREATE)')
    const { data: firstResult, error: firstError } = await supabase
      .from('bookings')
      .upsert(payload, { onConflict: 'booking_number', ignoreDuplicates: false })
      .select('id, booking_number, status, created_at, updated_at')
      .single()

    if (firstError) {
      console.error('❌ First upsert failed:', firstError)
      return
    }

    console.log('✅ First upsert successful:')
    console.log(JSON.stringify(firstResult, null, 2))
    console.log()

    // Wait a moment to see timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 2: Second upsert with same booking_number (should update)
    console.log('🔄 Test 2: Second upsert (UPDATE)')
    const updatedPayload = {
      ...payload,
      status: 'confirmed' as const,
      total_price: 30.000, // Changed price
      scheduled_start: new Date(Date.now() + 5*24*60*60*1000).toISOString(), // Changed date
    }

    const { data: secondResult, error: secondError } = await supabase
      .from('bookings')
      .upsert(updatedPayload, { onConflict: 'booking_number', ignoreDuplicates: false })
      .select('id, booking_number, status, total_price, scheduled_start, created_at, updated_at')
      .single()

    if (secondError) {
      console.error('❌ Second upsert failed:', secondError)
      return
    }

    console.log('✅ Second upsert successful:')
    console.log(JSON.stringify(secondResult, null, 2))
    console.log()

    // Verify the record was updated, not created
    if (firstResult.id === secondResult.id) {
      console.log('✅ PASS: Same record was updated (IDs match)')
      console.log(`   Created: ${firstResult.created_at}`)
      console.log(`   Updated: ${secondResult.updated_at}`)
    } else {
      console.log('❌ FAIL: New record was created instead of updating')
    }
    console.log()

    // Test 3: Query the final state
    console.log('🔄 Test 3: Query final state')
    const { data: finalState, error: queryError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_number', payload.booking_number)
      .single()

    if (queryError) {
      console.error('❌ Query failed:', queryError)
      return
    }

    console.log('✅ Final booking state:')
    console.log(JSON.stringify(finalState, null, 2))
    console.log()

    // Test 4: Test with different booking number (should create new)
    console.log('🔄 Test 4: Different booking number (CREATE NEW)')
    const newPayload = {
      ...payload,
      booking_number: 'BK-TEST-0000000043',
      status: 'pending' as const
    }

    const { data: newResult, error: newError } = await supabase
      .from('bookings')
      .upsert(newPayload, { onConflict: 'booking_number', ignoreDuplicates: false })
      .select('id, booking_number, status')
      .single()

    if (newError) {
      console.error('❌ New booking creation failed:', newError)
      return
    }

    console.log('✅ New booking created:')
    console.log(JSON.stringify(newResult, null, 2))
    console.log()

    if (newResult.id !== firstResult.id) {
      console.log('✅ PASS: Different booking number created new record')
    } else {
      console.log('❌ FAIL: Should have created new record with different booking number')
    }

    console.log('\n🎉 All tests completed successfully!')

  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

// Run the test
if (require.main === module) {
  testBookingUpsert()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { testBookingUpsert }