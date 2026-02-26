import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import {
  getRoleDisplay,
  canPerformAdminActions,
  canPerformUserActions,
} from '@/lib/role-hierarchy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { role, companyId } = await getCompanyRole(supabase);
    const resolvedRole = role ?? 'user';
    const roleInfo = getRoleDisplay(resolvedRole);

    return NextResponse.json({
      role: resolvedRole,
      roleInfo,
      companyId,
      canDoAdmin: canPerformAdminActions(resolvedRole),
      canDoUser: canPerformUserActions(resolvedRole),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
