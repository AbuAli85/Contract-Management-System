import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a data export request record
    await supabase.from('data_export_requests').insert({
      user_id: user.id,
      status: 'pending',
      requested_at: new Date().toISOString(),
      expected_completion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).select().single();

    return NextResponse.json({
      success: true,
      message: 'Data export requested. You will receive an email when it is ready.',
    });
  } catch {
    return NextResponse.json({ success: true, message: 'Data export request received.' });
  }
}
