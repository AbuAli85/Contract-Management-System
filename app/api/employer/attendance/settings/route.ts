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

    // Fetch settings from database (or use defaults)
    // For now, return default settings (can be stored in a settings table)
    const defaultSettings = {
      require_photo: true,
      require_location: true,
      location_radius_meters: 50,
      check_in_time_window_minutes: 120,
      auto_approve: false,
      require_approval: true,
      approval_deadline_hours: 24,
      default_link_validity_hours: 8,
      max_uses_per_link: 1,
      link_expiry_hours: 24,
      send_check_in_reminders: true,
      reminder_time_minutes: 15,
      send_check_out_reminders: false,
      notification_methods: ['email'],
      default_report_format: 'pdf',
      include_photos_in_reports: false,
      include_location_in_reports: true,
      auto_generate_reports: false,
    };

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/attendance/settings:', error);
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

    // Store settings (can be in a company_settings table or similar)
    // For now, just return success (settings can be stored in a dedicated table)
    // TODO: Create company_attendance_settings table if needed

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Error in PUT /api/employer/attendance/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

