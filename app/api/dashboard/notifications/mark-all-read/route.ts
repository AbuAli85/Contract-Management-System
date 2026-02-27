import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select('id');

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to mark all notifications as read', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      count: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
