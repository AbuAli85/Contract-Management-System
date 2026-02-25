import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return the current session info from Supabase auth
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;

    const sessions = currentSession
      ? [
          {
            id: currentSession.access_token.substring(0, 16),
            device: 'Current Browser',
            location: 'Unknown',
            lastActive: new Date().toISOString(),
            current: true,
            trusted: true,
            ip: null,
          },
        ]
      : [];

    return NextResponse.json({
      sessions,
      total: sessions.length,
      currentSession: sessions[0] ?? null,
      trustedSessions: sessions.filter(s => s.trusted).length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
