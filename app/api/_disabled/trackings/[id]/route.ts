import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const bookingId = params.id;

    console.log('📍 Updating tracking for booking:', bookingId);

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to update this tracking
    const { data: tracking, error: trackingError } = await supabase
      .from('trackings')
      .select(
        `
        *,
        booking:bookings(
          *,
          service:services(provider_id)
        )
      `
      )
      .eq('booking_id', bookingId)
      .single();

    if (trackingError) {
      console.error('Error fetching tracking:', trackingError);
      return NextResponse.json(
        { success: false, error: 'Tracking not found' },
        { status: 404 }
      );
    }

    // Check permissions - only provider or admin can update
    const userProfile = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isProvider = tracking.provider_id === session.user.id;
    const isAdmin = userProfile.data?.role === 'admin';

    if (!isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update tracking using the database function
    const { data: result, error: updateError } = await supabase.rpc(
      'update_tracking_status',
      {
        p_booking_id: bookingId,
        p_new_status: body.status,
        p_location_lat: body.location_lat || null,
        p_location_lng: body.location_lng || null,
        p_location_address: body.location_address || null,
        p_estimated_arrival: body.estimated_arrival || null,
        p_actual_arrival: body.actual_arrival || null,
        p_notes: body.notes || null,
      }
    );

    if (updateError) {
      console.error('Error updating tracking:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update tracking' },
        { status: 500 }
      );
    }

    if (!result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || 'Update failed' },
        { status: 400 }
      );
    }

    console.log('✅ Tracking updated successfully');

    // Log the tracking update
    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      action: 'tracking_updated',
      resource_type: 'tracking',
      resource_id: tracking.id,
      details: {
        booking_id: bookingId,
        old_status: tracking.status,
        new_status: body.status,
        location: body.location_address,
        notes: body.notes,
      },
    });

    return NextResponse.json({
      success: true,
      tracking: result.tracking,
      message: 'Tracking updated successfully',
    });
  } catch (error) {
    console.error('Tracking update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const bookingId = params.id;

    console.log('📍 Fetching tracking for booking:', bookingId);

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current tracking data
    const { data: currentTracking, error: currentError } = await supabase
      .from('trackings')
      .select(
        `
        *,
        booking:bookings(
          *,
          service:services(title, category, provider_id)
        )
      `
      )
      .eq('booking_id', bookingId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (currentError && currentError.code !== 'PGRST116') {
      console.error('Error fetching current tracking:', currentError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking' },
        { status: 500 }
      );
    }

    // Get tracking history
    const { data: trackingHistory, error: historyError } = await supabase
      .from('trackings')
      .select('*')
      .eq('booking_id', bookingId)
      .order('updated_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching tracking history:', historyError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking history' },
        { status: 500 }
      );
    }

    // Check permissions - user must be provider, client, or admin
    const userProfile = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isProvider = currentTracking?.provider_id === session.user.id;
    const isClient = currentTracking?.client_id === session.user.id;
    const isAdmin = userProfile.data?.role === 'admin';

    if (!isProvider && !isClient && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      current_tracking: currentTracking,
      tracking_history: trackingHistory || [],
      booking: currentTracking?.booking,
    });
  } catch (error) {
    console.error('Tracking fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
