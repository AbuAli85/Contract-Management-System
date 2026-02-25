import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch attendance settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active company if not provided
    let activeCompanyId = companyId;
    if (!activeCompanyId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();
      activeCompanyId = profile?.active_company_id;
    }

    if (!activeCompanyId) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    // Fetch settings from database using the function (returns defaults if not found)
    const { data: settingsData, error: settingsError } =
      await supabaseAdmin.rpc('get_company_attendance_settings', {
        p_company_id: activeCompanyId,
      });

    if (settingsError) {
      // Fallback to defaults if function fails
      const defaultSettings = {
        require_photo: true,
        require_location: true,
        location_radius_meters: 50,
        check_in_time_window_minutes: 120,
        default_check_in_time: '09:00',
        default_check_out_time: '17:00',
        standard_work_hours: 8.0,
        overtime_threshold_hours: 8.0,
        overtime_rate_multiplier: 1.5,
        allow_breaks: true,
        max_break_duration_minutes: 60,
        max_breaks_per_day: 2,
        unpaid_break_minutes: 0,
        late_threshold_minutes: 15,
        absent_threshold_hours: 4,
        auto_mark_absent: false,
        auto_mark_absent_time: '12:00',
        auto_approve: false,
        require_approval: true,
        approval_deadline_hours: 24,
        auto_approve_valid_checkins: false,
        default_link_validity_hours: 8,
        max_uses_per_link: 1,
        link_expiry_hours: 24,
        send_check_in_reminders: true,
        reminder_time_minutes: 15,
        send_check_out_reminders: false,
        send_approval_notifications: true,
        send_late_notifications: true,
        notification_methods: ['email'],
        default_report_format: 'pdf',
        include_photos_in_reports: false,
        include_location_in_reports: true,
        include_device_info_in_reports: false,
        auto_generate_reports: false,
        report_generation_schedule: 'monthly',
        report_generation_day: 1,
        enable_analytics: true,
        analytics_retention_days: 365,
        track_overtime_trends: true,
        track_attendance_patterns: true,
        alert_on_anomalies: true,
      };
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    // Transform database result to frontend format
    const settings =
      settingsData && settingsData.length > 0 ? settingsData[0] : null;

    if (!settings) {
      // Return defaults if no settings found
      const defaultSettings = {
        require_photo: true,
        require_location: true,
        location_radius_meters: 50,
        check_in_time_window_minutes: 120,
        default_check_in_time: '09:00',
        default_check_out_time: '17:00',
        standard_work_hours: 8.0,
        overtime_threshold_hours: 8.0,
        overtime_rate_multiplier: 1.5,
        allow_breaks: true,
        max_break_duration_minutes: 60,
        max_breaks_per_day: 2,
        unpaid_break_minutes: 0,
        late_threshold_minutes: 15,
        absent_threshold_hours: 4,
        auto_mark_absent: false,
        auto_mark_absent_time: '12:00',
        auto_approve: false,
        require_approval: true,
        approval_deadline_hours: 24,
        auto_approve_valid_checkins: false,
        default_link_validity_hours: 8,
        max_uses_per_link: 1,
        link_expiry_hours: 24,
        send_check_in_reminders: true,
        reminder_time_minutes: 15,
        send_check_out_reminders: false,
        send_approval_notifications: true,
        send_late_notifications: true,
        notification_methods: ['email'],
        default_report_format: 'pdf',
        include_photos_in_reports: false,
        include_location_in_reports: true,
        include_device_info_in_reports: false,
        auto_generate_reports: false,
        report_generation_schedule: 'monthly',
        report_generation_day: 1,
        enable_analytics: true,
        analytics_retention_days: 365,
        track_overtime_trends: true,
        track_attendance_patterns: true,
        alert_on_anomalies: true,
      };
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    // Format time values for frontend (convert TIME to HH:mm format)
    const formatTime = (time: any): string => {
      if (!time) return '09:00';
      if (typeof time === 'string') {
        // If already in HH:mm format, return as is
        if (time.match(/^\d{2}:\d{2}$/)) return time;
        // If in HH:mm:ss format, extract HH:mm
        if (time.match(/^\d{2}:\d{2}:\d{2}/)) return time.substring(0, 5);
        return time;
      }
      return '09:00';
    };

    const formattedSettings = {
      require_photo: settings.require_photo ?? true,
      require_location: settings.require_location ?? true,
      location_radius_meters: settings.location_radius_meters ?? 50,
      check_in_time_window_minutes:
        settings.check_in_time_window_minutes ?? 120,
      default_check_in_time: formatTime(settings.default_check_in_time),
      default_check_out_time: formatTime(settings.default_check_out_time),
      standard_work_hours: parseFloat(
        settings.standard_work_hours?.toString() || '8.0'
      ),
      overtime_threshold_hours: parseFloat(
        settings.overtime_threshold_hours?.toString() || '8.0'
      ),
      overtime_rate_multiplier: parseFloat(
        settings.overtime_rate_multiplier?.toString() || '1.5'
      ),
      allow_breaks: settings.allow_breaks ?? true,
      max_break_duration_minutes: settings.max_break_duration_minutes ?? 60,
      max_breaks_per_day: settings.max_breaks_per_day ?? 2,
      unpaid_break_minutes: settings.unpaid_break_minutes ?? 0,
      late_threshold_minutes: settings.late_threshold_minutes ?? 15,
      absent_threshold_hours: settings.absent_threshold_hours ?? 4,
      auto_mark_absent: settings.auto_mark_absent ?? false,
      auto_mark_absent_time: formatTime(settings.auto_mark_absent_time),
      auto_approve: settings.auto_approve ?? false,
      require_approval: settings.require_approval ?? true,
      approval_deadline_hours: settings.approval_deadline_hours ?? 24,
      auto_approve_valid_checkins:
        settings.auto_approve_valid_checkins ?? false,
      default_link_validity_hours: settings.default_link_validity_hours ?? 8,
      max_uses_per_link: settings.max_uses_per_link ?? 1,
      link_expiry_hours: settings.link_expiry_hours ?? 24,
      send_check_in_reminders: settings.send_check_in_reminders ?? true,
      reminder_time_minutes: settings.reminder_time_minutes ?? 15,
      send_check_out_reminders: settings.send_check_out_reminders ?? false,
      send_approval_notifications: settings.send_approval_notifications ?? true,
      send_late_notifications: settings.send_late_notifications ?? true,
      notification_methods: settings.notification_methods || ['email'],
      default_report_format: settings.default_report_format || 'pdf',
      include_photos_in_reports: settings.include_photos_in_reports ?? false,
      include_location_in_reports: settings.include_location_in_reports ?? true,
      include_device_info_in_reports:
        settings.include_device_info_in_reports ?? false,
      auto_generate_reports: settings.auto_generate_reports ?? false,
      report_generation_schedule:
        settings.report_generation_schedule || 'monthly',
      report_generation_day: settings.report_generation_day ?? 1,
      enable_analytics: settings.enable_analytics ?? true,
      analytics_retention_days: settings.analytics_retention_days ?? 365,
      track_overtime_trends: settings.track_overtime_trends ?? true,
      track_attendance_patterns: settings.track_attendance_patterns ?? true,
      alert_on_anomalies: settings.alert_on_anomalies ?? true,
    };

    return NextResponse.json({
      success: true,
      settings: formattedSettings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update attendance settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { company_id, settings } = body;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify company ownership
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .eq('owner_id', user.id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      );
    }

    // Convert time strings (HH:mm) to TIME format for database
    const convertTimeToDB = (timeStr: string): string | null => {
      if (!timeStr) return null;
      // If already in HH:mm:ss format, return as is
      if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr;
      // If in HH:mm format, add :00
      if (timeStr.match(/^\d{2}:\d{2}$/)) return `${timeStr}:00`;
      return null;
    };

    // Prepare settings for database insertion/update
    const dbSettings: any = {
      company_id,
      require_photo: settings.require_photo ?? true,
      require_location: settings.require_location ?? true,
      location_radius_meters: settings.location_radius_meters ?? 50,
      check_in_time_window_minutes:
        settings.check_in_time_window_minutes ?? 120,
      default_check_in_time:
        convertTimeToDB(settings.default_check_in_time) || '09:00:00',
      default_check_out_time:
        convertTimeToDB(settings.default_check_out_time) || '17:00:00',
      standard_work_hours: settings.standard_work_hours ?? 8.0,
      overtime_threshold_hours: settings.overtime_threshold_hours ?? 8.0,
      overtime_rate_multiplier: settings.overtime_rate_multiplier ?? 1.5,
      allow_breaks: settings.allow_breaks ?? true,
      max_break_duration_minutes: settings.max_break_duration_minutes ?? 60,
      max_breaks_per_day: settings.max_breaks_per_day ?? 2,
      unpaid_break_minutes: settings.unpaid_break_minutes ?? 0,
      late_threshold_minutes: settings.late_threshold_minutes ?? 15,
      absent_threshold_hours: settings.absent_threshold_hours ?? 4,
      auto_mark_absent: settings.auto_mark_absent ?? false,
      auto_mark_absent_time:
        convertTimeToDB(settings.auto_mark_absent_time) || '12:00:00',
      auto_approve: settings.auto_approve ?? false,
      require_approval: settings.require_approval ?? true,
      approval_deadline_hours: settings.approval_deadline_hours ?? 24,
      auto_approve_valid_checkins:
        settings.auto_approve_valid_checkins ?? false,
      default_link_validity_hours: settings.default_link_validity_hours ?? 8,
      max_uses_per_link: settings.max_uses_per_link ?? 1,
      link_expiry_hours: settings.link_expiry_hours ?? 24,
      send_check_in_reminders: settings.send_check_in_reminders ?? true,
      reminder_time_minutes: settings.reminder_time_minutes ?? 15,
      send_check_out_reminders: settings.send_check_out_reminders ?? false,
      send_approval_notifications: settings.send_approval_notifications ?? true,
      send_late_notifications: settings.send_late_notifications ?? true,
      notification_methods: settings.notification_methods || ['email'],
      default_report_format: settings.default_report_format || 'pdf',
      include_photos_in_reports: settings.include_photos_in_reports ?? false,
      include_location_in_reports: settings.include_location_in_reports ?? true,
      include_device_info_in_reports:
        settings.include_device_info_in_reports ?? false,
      auto_generate_reports: settings.auto_generate_reports ?? false,
      report_generation_schedule:
        settings.report_generation_schedule || 'monthly',
      report_generation_day: settings.report_generation_day ?? 1,
      enable_analytics: settings.enable_analytics ?? true,
      analytics_retention_days: settings.analytics_retention_days ?? 365,
      track_overtime_trends: settings.track_overtime_trends ?? true,
      track_attendance_patterns: settings.track_attendance_patterns ?? true,
      alert_on_anomalies: settings.alert_on_anomalies ?? true,
      updated_by: user.id,
    };

    // Check if settings already exist
    const { data: existing } = await supabaseAdmin
      .from('company_attendance_settings')
      .select('id')
      .eq('company_id', company_id)
      .single();

    let result;
    if (existing) {
      // Update existing settings
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('company_attendance_settings')
        .update(dbSettings)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      result = updated;
    } else {
      // Insert new settings
      dbSettings.created_by = user.id;
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('company_attendance_settings')
        .insert(dbSettings)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      result = inserted;
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
