import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { service_name, provider_id, service_id } = await request.json();

    if (!service_name || !provider_id || !service_id) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: service_name, provider_id, service_id',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert the service into the database
    const { data, error } = await supabase
      .from('services')
      .insert({
        id: service_id,
        service_name,
        provider_id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      service: data,
      message: 'Service created successfully and pending approval',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('services')
      .select(
        `
        id,
        service_name,
        status,
        provider_id,
        created_at,
        updated_at,
        profiles!inner(full_name)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      services: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
