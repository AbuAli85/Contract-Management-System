import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';

export const dynamic = 'force-dynamic';

/**
 * GET /api/get-user-role
 *
 * Returns the current user's role from the canonical `user_roles` table.
 * No hardcoded email fallbacks — if no role exists in user_roles, returns null.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const result = await getCompanyRole(supabase);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      // Keep legacy `role.value` shape for backward compatibility
      role: {
        value: result.role,
        source: 'user_roles',
        timestamp: new Date().toISOString(),
      },
      companyId: result.companyId,
      profileId: result.profileId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
