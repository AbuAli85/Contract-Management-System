import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRoleInfo, hasPermission } from '@/lib/enhanced-rbac';

// GET - Fetch services with enhanced filtering
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

    // Parse query parameters
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const providerId = searchParams.get('provider_id');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const rating = searchParams.get('min_rating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('provider_services')
      .select(
        `
        id,
        name,
        description,
        category,
        subcategory,
        price_base,
        price_currency,
        duration_minutes,
        max_participants,
        status,
        is_online_service,
        requires_approval,
        tags,
        images,
        metadata,
        created_at,
        provider:users!provider_id (
          id,
          full_name,
          avatar_url,
          company_id,
          companies (
            name,
            logo_url
          )
        ),
        service_reviews (
          rating,
          is_public
        )
      `
      )
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    if (minPrice) {
      query = query.gte('price_base', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price_base', parseFloat(maxPrice));
    }

    const { data: services, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Calculate average ratings and filter by rating if needed
    const servicesWithRatings =
      services
        ?.map(service => {
          const ratings =
            service.service_reviews
              ?.filter(r => r.is_public)
              .map(r => r.rating) || [];
          const averageRating =
            ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
              : 0;

          return {
            ...service,
            average_rating: averageRating,
            review_count: ratings.length,
          };
        })
        .filter(service => {
          if (rating) {
            return service.average_rating >= parseFloat(rating);
          }
          return true;
        }) || [];

    // Get total count for pagination
    let countQuery = supabase
      .from('provider_services')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    if (category) countQuery = countQuery.eq('category', category);
    if (search)
      countQuery = countQuery.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      );
    if (providerId) countQuery = countQuery.eq('provider_id', providerId);
    if (minPrice)
      countQuery = countQuery.gte('price_base', parseFloat(minPrice));
    if (maxPrice)
      countQuery = countQuery.lte('price_base', parseFloat(maxPrice));

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: servicesWithRatings,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      filters: {
        category,
        search,
        provider_id: providerId,
        min_price: minPrice,
        max_price: maxPrice,
        min_rating: rating,
      },
    });
  } catch (error) {
    console.error('Error in services API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new service (providers only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const { role } = await getUserRoleInfo(user.id);
    if (!hasPermission(role, 'services.create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'name',
      'description',
      'category',
      'price_base',
      'duration_minutes',
    ];
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

    // Get user's company if they have one
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const serviceData = {
      provider_id: user.id,
      company_id: userData?.company_id,
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      price_base: parseFloat(body.price_base),
      price_currency: body.price_currency || 'USD',
      duration_minutes: parseInt(body.duration_minutes),
      max_participants: parseInt(body.max_participants) || 1,
      min_advance_booking_hours: parseInt(body.min_advance_booking_hours) || 24,
      max_advance_booking_days: parseInt(body.max_advance_booking_days) || 90,
      is_online_service: body.is_online_service || false,
      requires_approval: body.requires_approval || false,
      cancellation_policy: body.cancellation_policy,
      tags: body.tags || [],
      images: body.images || [],
      metadata: body.metadata || {},
      availability_schedule: body.availability_schedule || {},
      status: 'active',
    };

    const { data: service, error } = await supabase
      .from('provider_services')
      .insert([serviceData])
      .select(
        `
        *,
        provider:users!provider_id (
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service created successfully',
    });
  } catch (error) {
    console.error('Error in create service API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
