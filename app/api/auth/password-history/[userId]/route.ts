import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get password history for a user
 * Used to prevent password reuse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only access their own password history
    if (user.id !== userId) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: You can only access your own password history' },
          { status: 403 }
        );
      }
    }

    // Get query params
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '5'), 10);

    // Fetch password history
    const { data: history, error } = await supabase
      .from('password_history')
      .select('password_hash, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching password history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch password history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hashes: (history || []).map((h) => h.password_hash),
      count: history?.length || 0,
    });
  } catch (error) {
    console.error('Password history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

