import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get announcements for the employee
export async function GET(request: NextRequest) {
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

    // Get employee link to find employer
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id, employer_id, department')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json({
        success: true,
        announcements: [],
        unreadCount: 0,
      });
    }

    // Get announcements from employer
    const now = new Date().toISOString();
    const { data: announcements, error: announcementsError } = await (
      supabaseAdmin.from('team_announcements') as any
    )
      .select(
        `
        *,
        created_by_user:created_by (
          full_name,
          avatar_url
        )
      `
      )
      .eq('employer_id', employeeLink.employer_id)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (announcementsError) {
      console.error('Error fetching announcements:', announcementsError);
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: 500 }
      );
    }

    // Filter by department if applicable
    let filteredAnnouncements = announcements || [];
    if (employeeLink.department) {
      filteredAnnouncements = filteredAnnouncements.filter(
        (a: any) =>
          !a.target_departments ||
          a.target_departments.length === 0 ||
          a.target_departments.includes(employeeLink.department)
      );
    }

    // Get read status
    const announcementIds = filteredAnnouncements.map((a: any) => a.id);
    const { data: reads } = await (
      supabaseAdmin.from('announcement_reads') as any
    )
      .select('announcement_id')
      .eq('employee_id', user.id)
      .in('announcement_id', announcementIds);

    const readIds = new Set((reads || []).map((r: any) => r.announcement_id));

    // Add read status to announcements
    const announcementsWithStatus = filteredAnnouncements.map((a: any) => ({
      ...a,
      is_read: readIds.has(a.id),
    }));

    const unreadCount = announcementsWithStatus.filter(
      (a: any) => !a.is_read
    ).length;

    return NextResponse.json({
      success: true,
      announcements: announcementsWithStatus,
      unreadCount,
    });
  } catch (error) {
    console.error('Error in announcements GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Mark announcement as read
export async function POST(request: NextRequest) {
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
    const { announcement_id } = body;

    if (!announcement_id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    // Mark as read (upsert to handle duplicates)
    await (supabaseAdmin.from('announcement_reads') as any).upsert(
      {
        announcement_id,
        employee_id: user.id,
        read_at: new Date().toISOString(),
      },
      {
        onConflict: 'announcement_id,employee_id',
        ignoreDuplicates: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Marked as read',
    });
  } catch (error) {
    console.error('Error in announcements POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
