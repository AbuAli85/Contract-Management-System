import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is admin or requesting their own activities
    const isAdmin = user.user_metadata?.role === 'admin';
    const isOwnActivity = targetUserId === user.id;

    if (!isAdmin && !isOwnActivity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = targetUserId || user.id;

    // Get user activities
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    // Get activity summary
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: summaryData, error: summaryError } = await supabase
      .from('user_activity_log')
      .select('created_at')
      .eq('user_id', userId);

    if (summaryError) {
      console.error('Error fetching summary:', summaryError);
    }

    const allActivities = summaryData || [];
    const todayActivities = allActivities.filter(
      a => new Date(a.created_at) >= today
    );
    const weekActivities = allActivities.filter(
      a => new Date(a.created_at) >= weekAgo
    );
    const monthActivities = allActivities.filter(
      a => new Date(a.created_at) >= monthAgo
    );

    const summary = {
      total_activities: allActivities.length,
      today_activities: todayActivities.length,
      this_week_activities: weekActivities.length,
      this_month_activities: monthActivities.length,
      recent_activities: activities?.slice(0, 10) || [],
    };

    return NextResponse.json({
      activities: activities || [],
      summary,
    });
  } catch (error) {
    console.error('User activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      user_id,
      user_name,
      user_email,
      action,
      resource_type,
      resource_id,
      resource_name,
      details,
    } = body;

    // Validate required fields
    if (!user_id || !action || !resource_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const ip_address =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Insert activity log
    const { data: activity, error: insertError } = await supabase
      .from('user_activity_log')
      .insert({
        user_id,
        user_name: user_name || user.user_metadata?.full_name || user.email,
        user_email: user_email || user.email,
        action,
        resource_type,
        resource_id,
        resource_name,
        details: details || {},
        ip_address,
        user_agent,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting activity:', insertError);
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('User activity POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
