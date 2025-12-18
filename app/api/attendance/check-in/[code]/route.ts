import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Validate attendance link and get check-in page data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const { code } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to check in.' },
        { status: 401 }
      );
    }

    // Get link details
    const { data: link, error: linkError } = await (supabaseAdmin.from('attendance_links') as any)
      .select('*')
      .eq('link_code', code)
      .eq('is_active', true)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Invalid or expired check-in link' },
        { status: 404 }
      );
    }

    // Check if link is still valid
    const now = new Date();
    const validFrom = new Date(link.valid_from);
    const validUntil = new Date(link.valid_until);

    if (now < validFrom || now > validUntil) {
      return NextResponse.json(
        { error: 'This check-in link has expired or is not yet active' },
        { status: 400 }
      );
    }

    // Check max uses
    if (link.max_uses && link.current_uses >= link.max_uses) {
      return NextResponse.json(
        { error: 'This check-in link has reached its maximum uses' },
        { status: 400 }
      );
    }

    // Get employee record
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id, employee_id, company_id')
      .eq('employee_id', user.id)
      .eq('company_id', link.company_id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'You are not authorized to use this check-in link' },
        { status: 403 }
      );
    }

    // Check if already checked in today using this link
    const { data: existingUsage } = await (supabaseAdmin.from('attendance_link_usage') as any)
      .select('id')
      .eq('attendance_link_id', link.id)
      .eq('employer_employee_id', employeeLink.id)
      .gte('used_at', new Date().toISOString().split('T')[0])
      .single();

    if (existingUsage) {
      return NextResponse.json(
        { error: 'You have already checked in using this link today' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        title: link.title,
        target_latitude: link.target_latitude,
        target_longitude: link.target_longitude,
        allowed_radius_meters: link.allowed_radius_meters,
        valid_until: link.valid_until,
      },
      employee: {
        employer_employee_id: employeeLink.id,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/attendance/check-in/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Process check-in using the link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const { code } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      latitude,
      longitude,
      accuracy,
      photo,
      device_info,
    } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location coordinates are required' },
        { status: 400 }
      );
    }

    // Get link details first
    const { data: linkData, error: linkError } = await (supabaseAdmin.from('attendance_links') as any)
      .select('*')
      .eq('link_code', code)
      .eq('is_active', true)
      .single();

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: 'Invalid or expired check-in link' },
        { status: 404 }
      );
    }

    // Validate link and location
    const { data: validation, error: validationError } = await supabaseAdmin.rpc(
      'validate_attendance_link',
      {
        p_link_code: code,
        p_latitude: latitude,
        p_longitude: longitude,
        p_employee_id: user.id,
      }
    );

    if (validationError || !validation || !validation.valid) {
      return NextResponse.json(
        {
          error: validation?.error || 'Link validation failed',
          distance_meters: validation?.distance_meters,
          required_radius: validation?.required_radius,
        },
        { status: 400 }
      );
    }

    const linkId = validation.link_id;
    const employerEmployeeId = validation.employer_employee_id;

    // Get employee link for company info
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id, company_id')
      .eq('id', employerEmployeeId)
      .single();

    // Upload photo if provided
    let photoUrl = null;
    if (photo && photo.startsWith('data:image')) {
      try {
        const base64Data = photo.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const today = new Date().toISOString().slice(0, 10);
        const fileName = `attendance/${user.id}/${today}-checkin-${Date.now()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('attendance-photos')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage
            .from('attendance-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData?.publicUrl || null;
        }
      } catch (error) {
        console.warn('Photo upload failed:', error);
      }
    }

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Generate device fingerprint
    const deviceFingerprint = device_info 
      ? `${device_info.userAgent || ''}-${device_info.platform || ''}-${device_info.screenWidth || ''}x${device_info.screenHeight || ''}`
      : null;

    // Determine status (late if after 9 AM)
    const hour = new Date().getHours();
    const status = hour >= 9 ? 'late' : 'present';

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // Check if attendance record exists for today
    const { data: existing } = await (supabaseAdmin.from('employee_attendance') as any)
      .select('*')
      .eq('employer_employee_id', employerEmployeeId)
      .eq('attendance_date', today)
      .single();

    let attendanceRecord;

    if (existing?.check_in) {
      return NextResponse.json(
        { error: 'You have already checked in today' },
        { status: 400 }
      );
    }

    if (existing) {
      // Update existing record
      const updateData: any = {
        check_in: now,
        status,
        latitude,
        longitude,
        location_accuracy: accuracy,
        location_verified: true,
        distance_from_office: validation.distance_meters,
        approval_status: 'pending',
        updated_at: now,
      };

      if (photoUrl) updateData.check_in_photo = photoUrl;
      if (ipAddress) updateData.ip_address = ipAddress;
      if (deviceFingerprint) updateData.device_fingerprint = deviceFingerprint;
      if (device_info) updateData.device_info = device_info;

      const { data: updated, error: updateError } = await (supabaseAdmin.from('employee_attendance') as any)
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      attendanceRecord = updated;
    } else {
      // Create new record
      const insertData: any = {
        employer_employee_id: employerEmployeeId,
        attendance_date: today,
        check_in: now,
        status,
        latitude,
        longitude,
        location_accuracy: accuracy,
        location_verified: true,
        distance_from_office: validation.distance_meters,
        approval_status: 'pending',
      };

      if (photoUrl) insertData.check_in_photo = photoUrl;
      if (ipAddress) insertData.ip_address = ipAddress;
      if (deviceFingerprint) insertData.device_fingerprint = deviceFingerprint;
      if (device_info) insertData.device_info = device_info;

      const { data: created, error: createError } = await (supabaseAdmin.from('employee_attendance') as any)
        .insert(insertData)
        .select()
        .single();

      if (createError) throw createError;
      attendanceRecord = created;
    }

    // Record link usage
    await (supabaseAdmin.from('attendance_link_usage') as any)
      .insert({
        attendance_link_id: linkId,
        employer_employee_id: employerEmployeeId,
        attendance_id: attendanceRecord.id,
        latitude,
        longitude,
        distance_from_target: validation.distance_meters,
        location_verified: true,
      });

    // Increment link usage count
    await (supabaseAdmin.from('attendance_links') as any)
      .update({ current_uses: (linkData.current_uses || 0) + 1 })
      .eq('id', linkId);

    return NextResponse.json({
      success: true,
      message: 'Checked in successfully using location-restricted link',
      attendance: attendanceRecord,
    });
  } catch (error) {
    console.error('Error in POST /api/attendance/check-in/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

