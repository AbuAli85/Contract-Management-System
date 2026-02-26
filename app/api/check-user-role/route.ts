import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';

export const dynamic = 'force-dynamic';

/**
 * GET /api/check-user-role
 *
 * Debug endpoint: returns the current user's role from the canonical user_roles table.
 * Only available in non-production environments.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, companyId, profileId } = await getCompanyRole(supabase);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      role,
      companyId,
      profileId,
      source: 'user_roles',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
