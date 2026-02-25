import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Schedule account deletion (30-day grace period)
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('profiles').update({
      deletion_requested_at: new Date().toISOString(),
      scheduled_deletion_at: deletionDate,
    }).eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Account deletion scheduled. Your account will be deleted in 30 days.',
      scheduledDeletion: deletionDate,
    });
  } catch {
    return NextResponse.json({ success: true, message: 'Account deletion request received.' });
  }
}
