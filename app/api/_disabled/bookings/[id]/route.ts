import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerBookingStatusChangeWebhook } from '@/lib/webhook-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const bookingId = params.id;
    const body = await request.json();

    console.log(`🔄 Updating booking ${bookingId} status...`);

    // Get user session
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

    // Get current booking to check permissions and old status
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        service:services(provider_id)
      `
      )
      .eq('id', bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this booking
    const canUpdate =
      currentBooking.user_id === session.user.id || // User owns the booking
      currentBooking.service?.provider_id === session.user.id || // Provider owns the service
      // Add admin/manager role check here if needed
      false;

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const oldStatus = currentBooking.status;
    const newStatus = body.status;

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled', 'completed'],
      in_progress: ['completed', 'cancelled'],
      completed: [], // No transitions from completed
      cancelled: ['pending'], // Allow re-activation
      refunded: [], // No transitions from refunded
    };

    if (newStatus && !validTransitions[oldStatus]?.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from ${oldStatus} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Update the booking
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) updateData.status = body.status;
    if (body.provider_notes) updateData.provider_notes = body.provider_notes;
    if (body.internal_notes) updateData.internal_notes = body.internal_notes;
    if (body.cancellation_reason)
      updateData.cancellation_reason = body.cancellation_reason;
    if (body.actual_start) updateData.actual_start = body.actual_start;
    if (body.actual_end) updateData.actual_end = body.actual_end;
    if (body.final_price) updateData.final_price = body.final_price;

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select(
        `
        *,
        service:services(title, category, provider_id),
        client:profiles!client_id(full_name, email),
        provider:profiles!provider_id(full_name, email, company_name)
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update booking',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Booking ${bookingId} updated successfully`);

    // Trigger webhook if status changed
    if (newStatus && oldStatus !== newStatus) {
      try {
        console.log(
          `🔔 Triggering status change webhook: ${oldStatus} → ${newStatus}`
        );
        const webhookResult = await triggerBookingStatusChangeWebhook(
          updatedBooking,
          oldStatus,
          newStatus
        );

        if (webhookResult.success) {
          console.log('✅ Status change webhook triggered successfully');
        } else {
          console.warn('⚠️ Status change webhook failed:', webhookResult.error);
        }
      } catch (webhookError) {
        console.error('❌ Status change webhook error:', webhookError);
        // Don't fail the update if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      status_changed: oldStatus !== newStatus,
      old_status: oldStatus,
      new_status: newStatus,
    });
  } catch (error) {
    console.error('Update booking error:', error);
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

    // Get user session
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

    // Get booking with related data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        `
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
      `
      )
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this booking
    const canView =
      booking.user_id === session.user.id || // User owns the booking
      booking.client_id === session.user.id || // User is the client
      booking.service?.provider_id === session.user.id || // Provider owns the service
      // Add admin/manager role check here if needed
      false;

    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
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
