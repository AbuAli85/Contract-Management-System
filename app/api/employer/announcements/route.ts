import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get all announcements created by employer
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

    const { data: announcements, error: announcementsError } = await (supabaseAdmin.from('team_announcements') as any)
      .select(`
        *,
        created_by_user:created_by (
          full_name
        )
      `)
      .eq('employer_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (announcementsError) {
      console.error('Error fetching announcements:', announcementsError);
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    // Get read counts for each announcement
    const announcementIds = (announcements || []).map((a: any) => a.id);
    const { data: readCounts } = await (supabaseAdmin.from('announcement_reads') as any)
      .select('announcement_id')
      .in('announcement_id', announcementIds);

    // Count reads per announcement
    const readCountMap: Record<string, number> = {};
    (readCounts || []).forEach((r: any) => {
      readCountMap[r.announcement_id] = (readCountMap[r.announcement_id] || 0) + 1;
    });

    // Add read count to announcements
    const announcementsWithCounts = (announcements || []).map((a: any) => ({
      ...a,
      read_count: readCountMap[a.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      announcements: announcementsWithCounts,
    });
  } catch (error) {
    console.error('Error in employer announcements GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new announcement
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
    const { title, content, priority, is_pinned, expires_at, target_departments } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const { data: announcement, error: createError } = await (supabaseAdmin.from('team_announcements') as any)
      .insert({
        employer_id: user.id,
        title,
        content,
        priority: priority || 'normal',
        is_pinned: is_pinned || false,
        expires_at: expires_at || null,
        target_departments: target_departments || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating announcement:', createError);
      return NextResponse.json(
        { error: 'Failed to create announcement', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      announcement,
    });
  } catch (error) {
    console.error('Error in employer announcements POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

