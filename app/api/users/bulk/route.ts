import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'employer', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { action, userIds } = await request.json();
    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request: action and userIds required' }, { status: 400 });
    }

    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const userId of userIds) {
      try {
        switch (action) {
          case 'activate':
            await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
            results.success.push(userId);
            break;
          case 'deactivate':
            await supabase.from('profiles').update({ status: 'inactive' }).eq('id', userId);
            results.success.push(userId);
            break;
          case 'delete':
            // Soft delete
            await supabase.from('profiles').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', userId);
            results.success.push(userId);
            break;
          case 'reset_password':
            // Get user email and send reset
            const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single();
            if (targetProfile?.email) {
              await supabase.auth.resetPasswordForEmail(targetProfile.email);
              results.success.push(userId);
            } else {
              results.failed.push(userId);
            }
            break;
          default:
            results.failed.push(userId);
        }
      } catch {
        results.failed.push(userId);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.success.length} users updated, ${results.failed.length} failed`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
