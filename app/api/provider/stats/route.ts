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

    // Get provider statistics
    const [
      { data: orders, error: ordersError },
      { data: services, error: servicesError },
    ] = await Promise.all([
      // Get all orders for this provider
      supabase
        .from('bookings')
        .select('id, status, total_amount, created_at')
        .eq('provider_id', user.id),

      // Get all services for this provider
      supabase
        .from('provider_services')
        .select('id, status, created_at')
        .eq('provider_id', user.id),
    ]);

    if (ordersError) {
      return NextResponse.json(
        { error: 'Failed to fetch order statistics' },
        { status: 500 }
      );
    }

    if (servicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch service statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const allOrders = orders || [];
    const allServices = services || [];

    const activeOrders = allOrders.filter(
      order => order.status === 'active'
    ).length;
    const completedOrders = allOrders.filter(
      order => order.status === 'completed'
    ).length;
    const totalOrders = allOrders.length;

    const totalEarnings = allOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    // Calculate this month's earnings
    const thisMonth = new Date();
    const firstDayThisMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth(),
      1
    );

    const thisMonthEarnings = allOrders
      .filter(
        order =>
          order.status === 'completed' &&
          new Date(order.created_at) >= firstDayThisMonth
      )
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    // Calculate completion rate
    const completionRate =
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // Service statistics
    const totalServices = allServices.length;
    const activeServices = allServices.filter(
      service => service.status === 'active'
    ).length;

    // Mock some values that would come from other tables/calculations
    const avgRating = 4.8; // This would come from reviews aggregation
    const responseRate = 95; // This would be calculated from response time tracking
    const pendingReviews = 3; // This would come from reviews table

    const stats = {
      active_orders: activeOrders,
      completed_orders: completedOrders,
      total_earnings: totalEarnings,
      avg_rating: avgRating,
      response_rate: responseRate,
      completion_rate: completionRate,
      pending_reviews: pendingReviews,
      this_month_earnings: thisMonthEarnings,
      total_services: totalServices,
      active_services: activeServices,
      total_orders: totalOrders,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
