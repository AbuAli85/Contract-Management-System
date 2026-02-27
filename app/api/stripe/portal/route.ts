import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';

export const dynamic = 'force-dynamic';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const BILLING_MODE = process.env.MODE || 'STRIPE';

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { role, companyId } = await getCompanyRole(supabase);

    if (!role || !companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { returnUrl } = body as { returnUrl?: string };

    // INTERNAL mode: no live portal; just point to internal billing page
    if (BILLING_MODE === 'INTERNAL' || !stripe) {
      return NextResponse.json({
        url: returnUrl || '/billing',
        mode: 'INTERNAL',
      });
    }

    const { data: companySub } = await supabase
      .from('company_subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', companyId)
      .maybeSingle();

    const stripeCustomerId = (companySub as any)?.stripe_customer_id as
      | string
      | undefined;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer associated with this company' },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url:
        returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing?portal=1`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create Stripe portal session' },
      { status: 500 }
    );
  }
}

