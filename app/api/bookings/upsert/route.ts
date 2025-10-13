import { NextRequest, NextResponse } from 'next/server';
import {
  upsertBooking,
  createBookingPayload,
  type BookingPayload,
} from '@/lib/booking-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📨 Booking upsert request:', body);

    // Validate required fields
    const requiredFields = ['service_id', 'provider_company_id', 'client_id'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          message: `Please provide: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create booking payload with defaults
    const bookingPayload = createBookingPayload(
      body as Partial<BookingPayload> &
        Pick<BookingPayload, 'service_id' | 'provider_company_id' | 'client_id'>
    );

    // Perform upsert
    const result = await upsertBooking(bookingPayload);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Booking ${result.booking_number} ${body.booking_number ? 'updated' : 'created'} successfully`,
    });
  } catch (error) {
    console.error('❌ API Booking upsert error:', error);

    return NextResponse.json(
      {
        error: 'Failed to upsert booking',
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Please check your request data and try again',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingNumber = searchParams.get('booking_number');

    if (!bookingNumber) {
      return NextResponse.json(
        {
          error: 'Missing booking_number parameter',
          message: 'Please provide a booking_number query parameter',
        },
        { status: 400 }
      );
    }

    // Use authenticated client with anon key and RLS policies
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required to access booking data',
        },
        { status: 401 }
      );
    }

    // Query with RLS enabled - user can only see bookings they have access to
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        booking_number,
        status,
        scheduled_start,
        scheduled_end,
        total_price,
        currency,
        notes,
        metadata,
        created_at,
        updated_at,
        services(id, name, description),
        companies!provider_company_id(id, name),
        profiles!client_id(id, email, full_name)
      `
      )
      .eq('booking_number', bookingNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Booking not found',
            message: `No booking found with number: ${bookingNumber}`,
          },
          { status: 404 }
        );
      }

      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: booking,
      message: `Booking ${bookingNumber} retrieved successfully`,
    });
  } catch (error) {
    console.error('❌ API Get booking error:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
