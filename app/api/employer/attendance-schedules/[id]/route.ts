import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// GET - Get a specific schedule
export const GET = withRBAC('attendance:read:all', async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    const { data: schedule, error } = await (supabaseAdmin.from('attendance_link_schedules') as any)
      .select(`
        *,
        created_by_user:created_by (
          id,
          full_name,
          email
        ),
        office_location:office_location_id (
          id,
          name,
          address,
          latitude,
          longitude,
          radius_meters
        )
      `)
      .eq('id', params.id)
      .eq('company_id', profile.active_company_id)
      .single();

    if (error || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/attendance-schedules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT - Update a schedule
export const PUT = withRBAC('attendance:create:all', async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Verify schedule belongs to company
    const { data: existingSchedule } = await supabaseAdmin
      .from('attendance_link_schedules')
      .select('id, office_location_id')
      .eq('id', params.id)
      .eq('company_id', profile.active_company_id)
      .single();

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Handle location updates
    let updateData: any = { ...body };
    
    if (body.office_location_id) {
      const { data: officeLocation } = await supabaseAdmin
        .from('office_locations')
        .select('latitude, longitude, radius_meters')
        .eq('id', body.office_location_id)
        .single();
      
      if (officeLocation) {
        updateData.target_latitude = officeLocation.latitude;
        updateData.target_longitude = officeLocation.longitude;
      }
    }

    // Calculate next generation date if time changed
    if (body.check_in_time) {
      const now = new Date();
      const [hours, minutes] = body.check_in_time.split(':').map(Number);
      const checkInDateTime = new Date();
      checkInDateTime.setHours(hours, minutes, 0, 0);
      
      updateData.next_generation_date = checkInDateTime > now 
        ? new Date().toISOString().split('T')[0]
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const { data: schedule, error } = await (supabaseAdmin.from('attendance_link_schedules') as any)
      .update(updateData)
      .eq('id', params.id)
      .eq('company_id', profile.active_company_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error('Error in PUT /api/employer/attendance-schedules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE - Delete a schedule
export const DELETE = withRBAC('attendance:create:all', async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('attendance_link_schedules')
      .delete()
      .eq('id', params.id)
      .eq('company_id', profile.active_company_id);

    if (error) {
      console.error('Error deleting schedule:', error);
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/employer/attendance-schedules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

