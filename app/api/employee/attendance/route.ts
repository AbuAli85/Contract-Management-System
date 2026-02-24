import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get my attendance records
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employee link
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id, company_id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Not assigned to any employer' },
        { status: 404 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const month =
      searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const startDate = `${month}-01`;
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr || '2025', 10);
    const monthNum = parseInt(monthStr || '1', 10);
    const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10);

    const supabaseAdmin = getSupabaseAdmin();
    const { data: attendance, error } = await (
      supabaseAdmin.from('employee_attendance') as any
    )
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .order('attendance_date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    // Calculate summary
    const totalDays = attendance?.length || 0;
    const presentDays =
      attendance?.filter(
        (a: any) => a.status === 'present' || a.status === 'late'
      ).length || 0;
    const lateDays =
      attendance?.filter((a: any) => a.status === 'late').length || 0;
    const absentDays =
      attendance?.filter((a: any) => a.status === 'absent').length || 0;
    const totalHours =
      attendance?.reduce(
        (sum: number, a: any) => sum + (parseFloat(a.total_hours) || 0),
        0
      ) || 0;
    const overtimeHours =
      attendance?.reduce(
        (sum: number, a: any) => sum + (parseFloat(a.overtime_hours) || 0),
        0
      ) || 0;
    const averageHours =
      presentDays > 0 ? (totalHours / presentDays).toFixed(1) : '0.0';

    return NextResponse.json({
      attendance: attendance || [],
      summary: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        totalHours: totalHours.toFixed(1),
        averageHours,
        overtimeHours: overtimeHours.toFixed(1),
      },
    });
  } catch (error) {
    console.error('Error in attendance GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Check in or check out
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      location,
      notes,
      latitude,
      longitude,
      accuracy,
      photo,
      device_info,
    } = body; // action: 'check_in' or 'check_out'

    if (!action || !['check_in', 'check_out'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use check_in or check_out' },
        { status: 400 }
      );
    }

    // Get IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded
      ? forwarded.split(',')[0]
      : request.headers.get('x-real-ip') || 'unknown';

    // Generate device fingerprint
    const deviceFingerprint = device_info
      ? `${device_info.userAgent || ''}-${device_info.platform || ''}-${device_info.screenWidth || ''}x${device_info.screenHeight || ''}`
      : null;

    // Get employee link
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id, company_id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Not assigned to any employer' },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const supabaseAdmin = getSupabaseAdmin();

    // Check existing attendance for today
    const { data: existing } = await (
      supabaseAdmin.from('employee_attendance') as any
    )
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .eq('attendance_date', today)
      .single();

    if (action === 'check_in') {
      if (existing?.check_in) {
        return NextResponse.json(
          { error: 'Already checked in today', attendance: existing },
          { status: 400 }
        );
      }

      // Fetch company attendance settings
      let companySettings: any = null;
      if (employeeLink.company_id) {
        try {
          const { data: settingsData } = await supabaseAdmin.rpc(
            'get_company_attendance_settings',
            {
              p_company_id: employeeLink.company_id,
            }
          );
          if (settingsData && settingsData.length > 0) {
            companySettings = settingsData[0];
          }
        } catch (error) {
          console.warn(
            'Failed to fetch company settings, using defaults:',
            error
          );
        }
      }

      // Get default check-in time from settings (default to 09:00)
      const defaultCheckInTime =
        companySettings?.default_check_in_time || '09:00:00';
      const [checkInHour, checkInMinute] = defaultCheckInTime
        .split(':')
        .map(Number);

      // Determine if late based on company settings
      const now = new Date();
      const checkInTime = new Date(now);
      checkInTime.setHours(checkInHour, checkInMinute || 0, 0, 0);

      const lateThresholdMinutes =
        companySettings?.late_threshold_minutes || 15;
      const minutesLate = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
      const status = minutesLate > lateThresholdMinutes ? 'late' : 'present';

      // Check if photo is required
      const requirePhoto = companySettings?.require_photo ?? true;
      if (requirePhoto && !photo) {
        return NextResponse.json(
          { error: 'Photo is required for check-in' },
          { status: 400 }
        );
      }

      // Check if location is required
      const requireLocation = companySettings?.require_location ?? true;
      if (requireLocation && (!latitude || !longitude)) {
        return NextResponse.json(
          { error: 'Location is required for check-in' },
          { status: 400 }
        );
      }

      // Verify location if GPS coordinates provided
      let locationVerified = false;
      let distanceFromOffice = null;
      const locationRadiusMeters =
        companySettings?.location_radius_meters || 50;

      if (latitude && longitude && employeeLink.company_id) {
        try {
          // @ts-ignore - Supabase RPC type inference issue
          const { data: locationVerification } = await supabaseAdmin.rpc(
            'verify_attendance_location',
            {
              p_attendance_id: existing?.id || null,
              p_latitude: latitude,
              p_longitude: longitude,
              p_company_id: employeeLink.company_id,
              p_radius_meters: locationRadiusMeters,
            }
          );
          if (locationVerification) {
            locationVerified = (locationVerification as any).verified || false;
            distanceFromOffice =
              (locationVerification as any).distance_meters || null;
          }
        } catch (error) {
          console.warn('Location verification failed:', error);
          // Continue without location verification if function doesn't exist yet
        }
      }

      // Determine approval status based on settings
      let approvalStatus = 'pending';
      const autoApprove = companySettings?.auto_approve ?? false;
      const autoApproveValidCheckins =
        companySettings?.auto_approve_valid_checkins ?? false;

      if (
        autoApprove ||
        (autoApproveValidCheckins && locationVerified && status === 'present')
      ) {
        approvalStatus = 'approved';
      }

      // Upload photo to storage if provided
      let photoUrl = null;
      if (photo && photo.startsWith('data:image')) {
        try {
          // Convert base64 to blob
          const base64Data = photo.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `attendance/${user.id}/${today}-checkin-${Date.now()}.jpg`;

          const { data: uploadData, error: uploadError } =
            await supabaseAdmin.storage
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

      if (existing) {
        // Update existing record
        const updateData: any = {
          check_in: now,
          status,
          location: location || existing.location,
          notes: notes || existing.notes,
          method: 'web',
          updated_at: now,
          approval_status: approvalStatus,
        };

        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;
        if (accuracy !== undefined) updateData.location_accuracy = accuracy;
        if (photoUrl) updateData.check_in_photo = photoUrl;
        if (ipAddress) updateData.ip_address = ipAddress;
        if (deviceFingerprint)
          updateData.device_fingerprint = deviceFingerprint;
        if (device_info) updateData.device_info = device_info;
        if (locationVerified !== undefined)
          updateData.location_verified = locationVerified;
        if (distanceFromOffice !== null)
          updateData.distance_from_office = distanceFromOffice;

        const { data: updated, error: updateError } = await (
          supabaseAdmin.from('employee_attendance') as any
        )
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return NextResponse.json({
          success: true,
          message: 'Checked in successfully. Pending manager approval.',
          attendance: updated,
        });
      } else {
        // Create new record
        const insertData: any = {
          employer_employee_id: employeeLink.id,
          attendance_date: today,
          check_in: now,
          status,
          location,
          notes,
          method: 'web',
          approval_status: approvalStatus,
        };

        if (latitude !== undefined) insertData.latitude = latitude;
        if (longitude !== undefined) insertData.longitude = longitude;
        if (accuracy !== undefined) insertData.location_accuracy = accuracy;
        if (photoUrl) insertData.check_in_photo = photoUrl;
        if (ipAddress) insertData.ip_address = ipAddress;
        if (deviceFingerprint)
          insertData.device_fingerprint = deviceFingerprint;
        if (device_info) insertData.device_info = device_info;
        if (locationVerified !== undefined)
          insertData.location_verified = locationVerified;
        if (distanceFromOffice !== null)
          insertData.distance_from_office = distanceFromOffice;

        const { data: created, error: createError } = await (
          supabaseAdmin.from('employee_attendance') as any
        )
          .insert(insertData)
          .select()
          .single();

        if (createError) throw createError;

        // Verify location after creation
        if (latitude && longitude && employeeLink.company_id && created?.id) {
          try {
            // @ts-ignore - Supabase RPC type inference issue
            await supabaseAdmin.rpc('verify_attendance_location', {
              p_attendance_id: created.id,
              p_latitude: latitude,
              p_longitude: longitude,
              p_company_id: employeeLink.company_id,
            });
          } catch (error) {
            console.warn('Location verification failed:', error);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Checked in successfully${status === 'late' ? ' (Late)' : ''}. Pending manager approval.`,
          attendance: created,
        });
      }
    } else {
      // check_out
      if (!existing?.check_in) {
        return NextResponse.json(
          { error: 'Must check in before checking out' },
          { status: 400 }
        );
      }

      if (existing?.check_out) {
        return NextResponse.json(
          { error: 'Already checked out today', attendance: existing },
          { status: 400 }
        );
      }

      // Handle active break if exists
      let finalBreakMinutes = existing.break_duration_minutes || 0;
      if (existing.break_start_time) {
        // End the active break
        const breakStart = new Date(existing.break_start_time);
        const breakEnd = new Date();
        const activeBreakMinutes = Math.round(
          (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60
        );
        finalBreakMinutes = finalBreakMinutes + activeBreakMinutes;
      }

      // Fetch company settings for overtime calculation
      let companySettings: any = null;
      if (employeeLink.company_id) {
        try {
          const { data: settingsData } = await supabaseAdmin.rpc(
            'get_company_attendance_settings',
            {
              p_company_id: employeeLink.company_id,
            }
          );
          if (settingsData && settingsData.length > 0) {
            companySettings = settingsData[0];
          }
        } catch (error) {
          console.warn('Failed to fetch company settings for checkout:', error);
        }
      }

      // Calculate total hours
      const checkInTime = new Date(existing.check_in);
      const checkOutTime = new Date();
      const totalMinutes =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
      const unpaidBreakMinutes = companySettings?.unpaid_break_minutes || 0;
      const netMinutes = totalMinutes - finalBreakMinutes - unpaidBreakMinutes;
      const totalHours = (netMinutes / 60).toFixed(2);

      // Calculate overtime based on company settings
      const standardWorkHours = parseFloat(
        companySettings?.standard_work_hours?.toString() || '8.0'
      );
      const overtimeThreshold = parseFloat(
        companySettings?.overtime_threshold_hours?.toString() || '8.0'
      );
      const overtimeHours = Math.max(
        0,
        parseFloat(totalHours) - overtimeThreshold
      ).toFixed(2);

      // Upload check-out photo if provided
      let checkOutPhotoUrl = null;
      if (photo && photo.startsWith('data:image')) {
        try {
          const base64Data = photo.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `attendance/${user.id}/${today}-checkout-${Date.now()}.jpg`;

          const { data: uploadData, error: uploadError } =
            await supabaseAdmin.storage
              .from('attendance-photos')
              .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: false,
              });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabaseAdmin.storage
              .from('attendance-photos')
              .getPublicUrl(fileName);
            checkOutPhotoUrl = urlData?.publicUrl || null;
          }
        } catch (error) {
          console.warn('Check-out photo upload failed:', error);
        }
      }

      const updateData: any = {
        check_out: now,
        total_hours: parseFloat(totalHours),
        overtime_hours: parseFloat(overtimeHours),
        break_duration_minutes: finalBreakMinutes,
        break_start_time: null, // Clear active break
        notes: notes || existing.notes,
        updated_at: now,
      };

      if (checkOutPhotoUrl) updateData.check_out_photo = checkOutPhotoUrl;
      if (latitude !== undefined) updateData.latitude = latitude;
      if (longitude !== undefined) updateData.longitude = longitude;
      if (accuracy !== undefined) updateData.location_accuracy = accuracy;
      if (ipAddress) updateData.ip_address = ipAddress;

      const { data: updated, error: updateError } = await (
        supabaseAdmin.from('employee_attendance') as any
      )
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: `Checked out. Total hours: ${totalHours}`,
        attendance: updated,
      });
    }
  } catch (error) {
    console.error('Error in attendance POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
