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

    const body = await request.json();
    const { priceId, successUrl, cancelUrl } = body as {
      priceId: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!priceId && BILLING_MODE !== 'INTERNAL') {
      return NextResponse.json(
        { error: 'Missing priceId for Stripe checkout' },
        { status: 400 }
      );
    }

    // INTERNAL mode: no Stripe checkout, just return a placeholder URL
    if (BILLING_MODE === 'INTERNAL' || !stripe) {
      return NextResponse.json({
        url: successUrl || '/billing',
        mode: 'INTERNAL',
      });
    }

    // Lookup or create a Stripe customer for this company
    const { data: companySub } = await supabase
      .from('company_subscriptions')
      .select('id, stripe_customer_id, company_id')
      .eq('company_id', companyId)
      .maybeSingle();

    let stripeCustomerId = (companySub as any)?.stripe_customer_id as
      | string
      | undefined;

    if (!stripeCustomerId) {
      const {
        data: companyProfile,
      } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .maybeSingle();

      const customer = await stripe.customers.create({
        name: companyProfile?.name,
        metadata: { company_id: companyId },
      });

      stripeCustomerId = customer.id;

      // Persist the customer id for future use
      await supabase
        .from('company_subscriptions')
        .upsert(
          {
            company_id: companyId,
            stripe_customer_id: stripeCustomerId,
          } as any,
          { onConflict: 'company_id' }
        );
    } else {
      // Ensure the existing Stripe customer has company_id metadata set
      try {
        const existingCustomer = await stripe.customers.retrieve(
          stripeCustomerId
        );
        const existingMetadata =
          (existingCustomer as Stripe.Customer).metadata || {};
        if (!existingMetadata.company_id) {
          await stripe.customers.update(stripeCustomerId, {
            metadata: {
              ...existingMetadata,
              company_id: companyId,
            },
          });
        }
      } catch {
        // Best-effort; failures here should not block checkout
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      client_reference_id: companyId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
      metadata: {
        company_id: companyId,
      },
      subscription_data: {
        metadata: {
          company_id: companyId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create Stripe checkout session' },
      { status: 500 }
    );
  }
}

