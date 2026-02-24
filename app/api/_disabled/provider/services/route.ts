import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { withRBAC } from '@/lib/rbac/guard';

export async function GET(_request: NextRequest) {
  try {
    const _headersList = headers();
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

    // Get provider services
    const { data: services, error: servicesError } = await supabase
      .from('provider_services')
      .select(
        `
        id,
        title,
        description,
        price,
        category,
        service_type,
        status,
        featured,
        delivery_time,
        created_at,
        updated_at,
        provider_id,
        bookings:bookings(count)
      `
      )
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.error('Error fetching provider services:', servicesError);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Format the services data
    const formattedServices = (services || []).map((service: any) => ({
      id: service.id,
      title: service.title || 'Untitled Service',
      description: service.description || '',
      price: service.price || 0,
      category: service.category || 'Digital Marketing',
      service_type: service.service_type || 'seo_audit',
      status: service.status || 'draft',
      orders_count: service.bookings?.[0]?.count || 0,
      rating: 4.8, // This would come from reviews aggregation
      views_count: Math.floor(Math.random() * 1000) + 100, // This would be tracked
      featured: service.featured || false,
      created_at: service.created_at,
      updated_at: service.updated_at,
      delivery_time: service.delivery_time || '5-7 days',
      provider_id: service.provider_id,
    }));

    return NextResponse.json({ services: formattedServices });
  } catch (error) {
    console.error('Error in provider services API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRBAC(
  'service:create:own',
  async (request: NextRequest) => {
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

      // Parse request body
      const body = await request.json();
      const {
        title,
        description,
        price,
        service_type,
        delivery_time,
        category,
      } = body;

      // Validate required fields
      if (!title || !description || !price || !service_type) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: title, description, price, service_type',
          },
          { status: 400 }
        );
      }

      // Create new service
      const { data: newService, error: createError } = await supabase
        .from('provider_services')
        .insert({
          title,
          description,
          price,
          service_type,
          delivery_time: delivery_time || '5-7 days',
          category: category || 'Digital Marketing',
          provider_id: user.id,
          status: 'draft',
          featured: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating service:', createError);
        return NextResponse.json(
          { error: 'Failed to create service' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Service created successfully',
        service: newService,
      });
    } catch (error) {
      console.error('Error in create service API:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

export const PUT = withRBAC(
  'service:update:own',
  async (request: NextRequest) => {
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
      const { id, ...updateData } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'Service ID is required' },
          { status: 400 }
        );
      }

      // Update service (only if user owns it)
      const { data: updatedService, error: updateError } = await supabase
        .from('provider_services')
        .update(updateData)
        .eq('id', id)
        .eq('provider_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating service:', updateError);
        return NextResponse.json(
          { error: 'Failed to update service' },
          { status: 500 }
        );
      }

      if (!updatedService) {
        return NextResponse.json(
          { error: 'Service not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Service updated successfully',
        service: updatedService,
      });
    } catch (error) {
      console.error('Error in update service API:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
