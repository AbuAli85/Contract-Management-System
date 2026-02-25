import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security event log not yet implemented
    return NextResponse.json({
      events: [],
      total: 0,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}
