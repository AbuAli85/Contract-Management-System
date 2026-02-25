import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// GET - List all attendance schedules for the company
export const GET = withRBAC(
  'attendance:read:all',
  async (request: NextRequest) => {
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

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id, role')
        .eq('id', user.id)
        .single();

      if (!profile?.active_company_id) {
        return NextResponse.json(
          { error: 'No active company found' },
          { status: 400 }
        );
      }

      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('include_inactive') === 'true';

      // Build query
      let query = (supabaseAdmin.from('attendance_link_schedules') as any)
        .select(
          `
        *,
        created_by_user:created_by (
          id,
          full_name,
          email
        ),
        office_location:office_location_id (
          id,
          name,
          address
        )
      `
        )
        .eq('company_id', profile.active_company_id)
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data: schedules, error } = await query;

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch attendance schedules' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        schedules: schedules || [],
        count: schedules?.length || 0,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// POST - Create a new attendance schedule
export const POST = withRBAC(
  'attendance:create:all',
  async (request: NextRequest) => {
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

      const body = await request.json();
      const {
        name,
        description,
        office_location_id,
        target_latitude,
        target_longitude,
        allowed_radius_meters = 50,
        check_in_time,
        check_out_time,
        link_valid_duration_hours = 2,
        monday = true,
        tuesday = true,
        wednesday = true,
        thursday = true,
        friday = true,
        saturday = false,
        sunday = false,
        send_check_in_link = true,
        send_check_out_link = false,
        notification_method = ['email'],
        send_before_minutes = 15,
        send_to_all_employees = true,
        specific_employee_ids = [],
        employee_group_ids = [],
        assignment_type = 'all',
        max_uses_per_link,
        require_photo = true,
        require_location_verification = true,
      } = body;

      // Validation
      if (!name) {
        return NextResponse.json(
          { error: 'Schedule name is required' },
          { status: 400 }
        );
      }

      if (!check_in_time) {
        return NextResponse.json(
          { error: 'Check-in time is required' },
          { status: 400 }
        );
      }

      // Location validation
      if (!office_location_id && (!target_latitude || !target_longitude)) {
        return NextResponse.json(
          {
            error:
              'Either office location or custom coordinates must be provided',
          },
          { status: 400 }
        );
      }

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id, role')
        .eq('id', user.id)
        .single();

      if (!profile?.active_company_id) {
        return NextResponse.json(
          { error: 'No active company found' },
          { status: 400 }
        );
      }

      // If using office location, get coordinates
      let finalLatitude = target_latitude;
      let finalLongitude = target_longitude;

      if (office_location_id) {
        const { data: officeLocation } = await supabaseAdmin
          .from('office_locations')
          .select('latitude, longitude, radius_meters')
          .eq('id', office_location_id)
          .single();

        if (officeLocation) {
          finalLatitude = officeLocation.latitude;
          finalLongitude = officeLocation.longitude;
          if (!allowed_radius_meters) {
            // Use office location's default radius if not specified
          }
        }
      }

      // Calculate next generation date (tomorrow if today's time has passed, otherwise today)
      const now = new Date();
      const [hours, minutes] = check_in_time.split(':').map(Number);
      const checkInDateTime = new Date();
      checkInDateTime.setHours(hours, minutes, 0, 0);

      const nextGenerationDate =
        checkInDateTime > now
          ? new Date().toISOString().split('T')[0]
          : new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0];

      // Create the schedule
      const { data: schedule, error: createError } = await (
        supabaseAdmin.from('attendance_link_schedules') as any
      )
        .insert({
          company_id: profile.active_company_id,
          created_by: user.id,
          name,
          description,
          office_location_id: office_location_id || null,
          target_latitude: finalLatitude,
          target_longitude: finalLongitude,
          allowed_radius_meters,
          check_in_time,
          check_out_time: check_out_time || null,
          link_valid_duration_hours,
          monday,
          tuesday,
          wednesday,
          thursday,
          friday,
          saturday,
          sunday,
          send_check_in_link,
          send_check_out_link,
          notification_method: Array.isArray(notification_method)
            ? notification_method
            : [notification_method],
          send_before_minutes,
          send_to_all_employees,
          specific_employee_ids:
            assignment_type === 'selected' && specific_employee_ids.length > 0
              ? specific_employee_ids
              : null,
          employee_group_ids:
            (assignment_type === 'groups' ||
              assignment_type === 'location_based') &&
            employee_group_ids.length > 0
              ? employee_group_ids
              : null,
          assignment_type:
            assignment_type || (send_to_all_employees ? 'all' : 'selected'),
          max_uses_per_link: max_uses_per_link || null,
          require_photo,
          require_location_verification,
          next_generation_date: nextGenerationDate,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          {
            error: 'Failed to create attendance schedule',
            details: createError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        schedule,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
