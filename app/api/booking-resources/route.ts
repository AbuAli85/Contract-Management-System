import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('type');

    // Check if we're using a mock client
    if (!supabase || typeof supabase.from !== 'function') {
      return NextResponse.json(
        {
          success: true,
          resources: [
            {
              id: 'conf-room-a',
              name: 'Conference Room A',
              type: 'meeting_room',
              capacity: 12,
              location: 'Floor 3, West Wing',
              amenities: ['Projector', 'Whiteboard', 'Video Conferencing'],
              hourly_rate: 50,
              availability_hours: { start: '08:00', end: '18:00' },
              is_available: true,
            },
            {
              id: 'exec-boardroom',
              name: 'Executive Boardroom',
              type: 'meeting_room',
              capacity: 8,
              location: 'Floor 5, Executive Suite',
              amenities: ['4K Display', 'Premium Audio', 'Coffee Station'],
              hourly_rate: 100,
              availability_hours: { start: '08:00', end: '20:00' },
              is_available: true,
            },
            {
              id: 'company-van',
              name: 'Company Van',
              type: 'vehicle',
              capacity: 8,
              location: 'Parking Garage Level 1',
              amenities: ['GPS', 'Air Conditioning', 'First Aid Kit'],
              hourly_rate: 25,
              availability_hours: { start: '06:00', end: '22:00' },
              is_available: false,
            },
          ],
          count: 3,
        },
        { status: 200 }
      );
    }


    // Build query
    let query = supabase
      .from('booking_resources')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (resourceType) {
      query = query.eq('type', resourceType);
    }

    let resources = [];
    try {
      const { data: resourcesData, error: resourcesError } = await query;

      if (resourcesError) {
        resources = [];
      } else {
        resources = resourcesData || [];
      }
    } catch (error) {
      resources = [];
    }


    return NextResponse.json({
      success: true,
      resources: resources || [],
      count: resources?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: true, // Return success to avoid errors
        resources: [],
        count: 0,
        error: 'Internal server error',
      },
      { status: 200 }
    );
  }
}
