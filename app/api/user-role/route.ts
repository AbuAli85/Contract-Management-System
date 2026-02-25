import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import {
  getRoleDisplay,
  canPerformAdminActions,
  canPerformUserActions,
} from '@/lib/role-hierarchy';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {

    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }


    // Try to get role using RPC function
    try {
      const { data: roleData, error: roleError } = await (supabase as any).rpc(
        'get_user_role',
        { uid: user.id }
      );

      if (roleError) {

        // Fallback: Check if user is admin by email
        const fallbackRole =
          user.email === 'luxsess2001@gmail.com' ? 'admin' : 'user';

        const roleInfo = getRoleDisplay(fallbackRole);

        return NextResponse.json({
          role: fallbackRole,
          roleInfo,
          canDoAdmin: canPerformAdminActions(fallbackRole),
          canDoUser: canPerformUserActions(fallbackRole),
        });
      }

      const role = roleData || 'user';

      const roleInfo = getRoleDisplay(role);

      return NextResponse.json({
        role,
        roleInfo,
        canDoAdmin: canPerformAdminActions(role),
        canDoUser: canPerformUserActions(role),
      });
    } catch (error) {

      // Final fallback
      const fallbackRole =
        user.email === 'luxsess2001@gmail.com' ? 'admin' : 'user';

      const roleInfo = getRoleDisplay(fallbackRole);

      return NextResponse.json({
        role: fallbackRole,
        roleInfo,
        canDoAdmin: canPerformAdminActions(fallbackRole),
        canDoUser: canPerformUserActions(fallbackRole),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
