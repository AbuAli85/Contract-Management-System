import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Use service role client to get user details
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }

    const user = authData.users.find(u => u.id === userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
      });

    if (sessionError) {
      return NextResponse.json(
        { error: 'Session generation failed' },
        { status: 500 }
      );
    }


    return NextResponse.json({
      message: 'Authentication helper ready',
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user',
      },
      auth_url: sessionData.properties?.action_link,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
