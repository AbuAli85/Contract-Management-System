import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subscription/check-limit?resource=contracts
 *
 * Checks whether the current company has reached its plan limit for a resource.
 * Returns { allowed: boolean, current: number, limit: number | null, plan: string }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { role, companyId } = await getCompanyRole(supabase);

    if (!role || !companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');

    if (!resource) {
      return NextResponse.json(
        { error: 'Missing required query parameter: resource' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('check_plan_limit', {
      p_company_id: companyId,
      p_resource: resource,
    });

    if (error) {
      // If the function doesn't exist yet, return a permissive default
      return NextResponse.json({
        allowed: true,
        current: 0,
        limit: null,
        plan: 'unknown',
        error: error.message,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
