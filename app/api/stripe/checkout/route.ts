import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';

export const dynamic = 'force-dynamic';

const BILLING_MODE = process.env.MODE || 'INTERNAL';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { role, companyId } = await getCompanyRole(supabase);

    if (!role || !companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { successUrl } = body as {
      successUrl?: string;
    };

    // Stripe SDK is not available in this deployment.
    // For now, short-circuit to an internal billing URL.
    return NextResponse.json({
      url: successUrl || '/billing',
      mode: BILLING_MODE,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to create billing checkout session (Stripe disabled in this environment)',
      },
      { status: 500 }
    );
  }
}

