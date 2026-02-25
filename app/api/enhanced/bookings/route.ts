import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRoleInfo, hasPermission } from '@/lib/enhanced-rbac';

// GET - Fetch bookings with role-based filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Get authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { role } = await getUserRoleInfo(user.id);

    // Parse query parameters
    const status = searchParams.get('status');
    const serviceId = searchParams.get('service_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build base query with role-based filtering
    let query = supabase.from('bookings').select(`
        id,
        booking_number,
        scheduled_start,
        scheduled_end,
        actual_start,
        actual_end,
        status,
        total_price,
        currency,
        client_notes,
        provider_notes,
        cancellation_reason,
        payment_status,
        payment_method,
        is_recurring,
        booking_metadata,
        created_at,
        updated_at,
        service:provider_services (
          id,
          name,
          category,
          duration_minutes,
          provider:users!provider_id (
            id,
            full_name,
            avatar_url
          )
        ),
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
          avatar_url
        )
      `);

    // Apply role-based filtering
    if (role === 'client' || role === 'user') {
      query = query.eq('client_id', user.id);
    } else if (role === 'provider') {
      query = query.eq('provider_id', user.id);
    } else if (!hasPermission(role, 'bookings.view_all')) {
      // For other roles without view_all permission, show their own bookings
      query = query.or(`client_id.eq.${user.id},provider_id.eq.${user.id}`);
    }

    // Apply additional filters
    if (status) {
      query = query.eq('status', status);
    }

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    if (startDate) {
      query = query.gte('scheduled_start', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_start', endDate);
    }

    query = query
      .range(offset, offset + limit - 1)
      .order('scheduled_start', { ascending: false });

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Get total count for pagination (with same filters)
    let countQuery = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    // Apply same role-based filtering for count
    if (role === 'client' || role === 'user') {
      countQuery = countQuery.eq('client_id', user.id);
    } else if (role === 'provider') {
      countQuery = countQuery.eq('provider_id', user.id);
    } else if (!hasPermission(role, 'bookings.view_all')) {
      countQuery = countQuery.or(
        `client_id.eq.${user.id},provider_id.eq.${user.id}`
      );
    }

    if (status) countQuery = countQuery.eq('status', status);
    if (serviceId) countQuery = countQuery.eq('service_id', serviceId);
    if (startDate) countQuery = countQuery.gte('scheduled_start', startDate);
    if (endDate) countQuery = countQuery.lte('scheduled_start', endDate);

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: bookings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      filters: {
        status,
        service_id: serviceId,
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new booking (clients only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const { role } = await getUserRoleInfo(user.id);
    if (!hasPermission(role, 'bookings.create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['service_id', 'scheduled_start', 'scheduled_end'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Get service details and validate
    const { data: service, error: serviceError } = await supabase
      .from('provider_services')
      .select(
        `
        id,
        name,
        provider_id,
        price_base,
        price_currency,
        duration_minutes,
        max_participants,
        status,
        requires_approval,
        min_advance_booking_hours,
        max_advance_booking_days
      `
      )
      .eq('id', body.service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.status !== 'active') {
      return NextResponse.json(
        { error: 'Service is not available' },
        { status: 400 }
      );
    }

    // Validate booking time constraints
    const scheduledStart = new Date(body.scheduled_start);
    const scheduledEnd = new Date(body.scheduled_end);
    const now = new Date();

    const hoursInAdvance =
      (scheduledStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysInAdvance = hoursInAdvance / 24;

    if (hoursInAdvance < service.min_advance_booking_hours) {
      return NextResponse.json(
        {
          error: `Booking must be made at least ${service.min_advance_booking_hours} hours in advance`,
        },
        { status: 400 }
      );
    }

    if (daysInAdvance > service.max_advance_booking_days) {
      return NextResponse.json(
        {
          error: `Booking cannot be made more than ${service.max_advance_booking_days} days in advance`,
        },
        { status: 400 }
      );
    }

    // Check for time conflicts
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('provider_id', service.provider_id)
      .in('status', ['confirmed', 'pending'])
      .or(
        `and(scheduled_start.lte.${body.scheduled_start},scheduled_end.gt.${body.scheduled_start}),and(scheduled_start.lt.${body.scheduled_end},scheduled_end.gte.${body.scheduled_end})`
      );

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 409 }
      );
    }

    // Calculate total price
    const participantCount = parseInt(body.participant_count) || 1;
    if (participantCount > service.max_participants) {
      return NextResponse.json(
        {
          error: `Maximum ${service.max_participants} participants allowed`,
        },
        { status: 400 }
      );
    }

    const totalPrice = service.price_base * participantCount;

    const bookingData = {
      service_id: body.service_id,
      client_id: user.id,
      provider_id: service.provider_id,
      scheduled_start: body.scheduled_start,
      scheduled_end: body.scheduled_end,
      total_price: totalPrice,
      currency: service.price_currency,
      client_notes: body.client_notes,
      booking_metadata: {
        participant_count: participantCount,
        booking_source: 'web_app',
        ...body.metadata,
      },
      status: service.requires_approval ? 'pending' : 'confirmed',
      payment_status: 'pending',
    };

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(
        `
        *,
        service:provider_services (
          name,
          provider:users!provider_id (
            full_name,
            email
          )
        ),
        client:users!client_id (
          full_name,
          email
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Create booking event for audit trail
    await supabase.from('booking_events').insert([
      {
        booking_id: booking.id,
        event_type: 'booking_created',
        description: `Booking created by ${booking.client?.full_name}`,
        created_by: user.id,
        new_value: { status: booking.status, total_price: totalPrice },
      },
    ]);

    // Send notification email to provider
    try {
      const providerEmail = (booking as any).service?.provider?.email;
      const clientName =
        (booking as any).client?.full_name ?? 'A client';
      const serviceName = (booking as any).service?.name ?? 'your service';
      if (providerEmail) {
        const { sendEmail } = await import('@/lib/services/email.service');
        await sendEmail({
          to: providerEmail,
          subject: `New Booking ${booking.status === 'pending' ? 'Request' : 'Confirmed'} - ${serviceName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2>New Booking ${booking.status === 'pending' ? 'Request' : 'Confirmed'}</h2>
              <p><strong>${clientName}</strong> has ${booking.status === 'pending' ? 'requested' : 'booked'} <strong>${serviceName}</strong>.</p>
              <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Date:</strong> ${new Date(booking.scheduled_start).toLocaleString()}</p>
                <p><strong>Total:</strong> ${booking.total_price} ${booking.currency}</p>
                <p><strong>Status:</strong> ${booking.status}</p>
              </div>
              ${booking.status === 'pending' ? '<p>Please log in to review and approve this booking request.</p>' : ''}
            </div>
          `,
        });
      }
    } catch {
      // Do not fail booking creation if notification fails
    }

    return NextResponse.json({
      success: true,
      data: booking,
      message: service.requires_approval
        ? 'Booking request submitted for approval'
        : 'Booking confirmed successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
