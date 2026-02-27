import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const BILLING_MODE = process.env.MODE || 'STRIPE';

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

export async function POST(request: NextRequest) {
  // INTERNAL mode: ignore Stripe webhooks
  if (BILLING_MODE === 'INTERNAL' || !stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true, mode: 'INTERNAL' });
  }

  const supabase = await createClient();

  const sig = request.headers.get('stripe-signature');
  const rawBody = await request.text(); // Stripe requires raw body

  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;
        const stripeCustomerId = subscription.customer as string;

        const companyId =
          (subscription.metadata && subscription.metadata.company_id) || null;

        // Only sync when we have a company_id in metadata
        if (companyId) {
          const status = subscription.status;
          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          // Map Stripe price/product to a plan in subscription_plans if needed
          const planMetadata = subscription.items.data[0]?.price?.metadata || {};
          const planName =
            (planMetadata.plan_name as string) ||
            (subscription.items.data[0]?.price?.nickname as string) ||
            null;

          let planId: string | null = null;

          if (planName) {
            const { data: planRow } = await supabase
              .from('subscription_plans')
              .select('id')
              .eq('name', planName)
              .maybeSingle();
            planId = planRow?.id ?? null;
          }

          // Upsert company_subscriptions
          await supabase
            .from('company_subscriptions')
            .upsert(
              {
                company_id: companyId,
                plan_id: planId,
                status,
                current_period_end: currentPeriodEnd,
                external_id: stripeSubId,
                stripe_customer_id: stripeCustomerId,
              } as any,
              { onConflict: 'company_id' }
            );
        }
        break;
      }
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        const companyId = (customer.metadata && (customer.metadata.company_id as string)) || null;

        if (companyId) {
          await supabase
            .from('company_subscriptions')
            .upsert(
              {
                company_id: companyId,
                stripe_customer_id: customer.id,
              } as any,
              { onConflict: 'company_id' }
            );
        }
        break;
      }
      default:
        // Ignore other events for now
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process Stripe webhook' },
      { status: 500 }
    );
  }
}

