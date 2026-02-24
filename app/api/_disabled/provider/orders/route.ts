import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a provider
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'provider') {
      return NextResponse.json(
        { error: 'Access denied. Provider role required.' },
        { status: 403 }
      );
    }

    // Get provider orders/bookings
    const { data: orders, error: ordersError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        title,
        description,
        status,
        total_amount,
        start_date,
        end_date,
        created_at,
        updated_at,
        service_id,
        client:client_id(
          id,
          full_name,
          avatar_url,
          email
        ),
        service:service_id(
          id,
          title,
          service_type
        )
      `
      )
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching provider orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Calculate progress based on status
    const calculateOrderProgress = (status: string): number => {
      switch (status) {
        case 'pending':
          return 0;
        case 'active':
          return 50;
        case 'delivered':
          return 90;
        case 'completed':
          return 100;
        case 'revision_requested':
          return 75;
        default:
          return 0;
      }
    };

    // Format the orders data
    const formattedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      title: order.title || order.service?.title || 'Service Order',
      description: order.description || '',
      client: {
        id: order.client?.id || '',
        name: order.client?.full_name || 'Unknown Client',
        avatar_url: order.client?.avatar_url || '',
        email: order.client?.email || '',
      },
      status: order.status || 'pending',
      budget: order.total_amount || 0,
      deadline: order.end_date || order.start_date,
      progress: calculateOrderProgress(order.status),
      service_type: order.service?.service_type || 'general',
      created_at: order.created_at,
      updated_at: order.updated_at,
      service_id: order.service_id,
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error in provider orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { orderId, status, ...updateData } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      'pending',
      'active',
      'delivered',
      'completed',
      'cancelled',
      'revision_requested',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update order status (only if user is the provider)
    const { data: updatedOrder, error: updateError } = await supabase
      .from('bookings')
      .update({
        status,
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('provider_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // TODO: Send notification to client about status change
    // TODO: Trigger Make.com webhook for order status update

    return NextResponse.json({
      message: `Order ${status} successfully`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error in update order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
