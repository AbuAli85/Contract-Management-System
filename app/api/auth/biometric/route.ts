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

    // Biometric authentication is not yet configured
    return NextResponse.json({
      enabled: false,
      supported: false,
      lastUsed: null,
      deviceCount: 0,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch biometric status' },
      { status: 500 }
    );
  }
}
