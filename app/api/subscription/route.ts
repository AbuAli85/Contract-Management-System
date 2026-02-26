import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subscription
 *
 * Returns the current company's active subscription plan details.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { role, companyId } = await getCompanyRole(supabase);

    if (!role || !companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subscription, error } = await supabase
      .from('company_subscriptions')
      .select(`
        id,
        status,
        current_period_start,
        current_period_end,
        trial_ends_at,
        external_id,
        subscription_plans (
          id,
          name,
          display_name,
          price_monthly,
          price_yearly,
          currency,
          max_contracts,
          max_promoters,
          max_users,
          max_storage_gb,
          features
        )
      `)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      // Return a default free plan if no subscription found
      return NextResponse.json({
        subscription: null,
        plan: {
          name: 'free',
          display_name: 'Free',
          max_contracts: 10,
          max_promoters: 5,
          max_users: 3,
          max_storage_gb: 1,
          features: [],
        },
        isTrialing: false,
        daysRemaining: null,
      });
    }

    const plan = (subscription as any).subscription_plans;
    const now = new Date();
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const trialEnd = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null;

    const isTrialing = trialEnd ? trialEnd > now : false;
    const daysRemaining = periodEnd
      ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        trialEndsAt: subscription.trial_ends_at,
        externalId: subscription.external_id,
      },
      plan,
      isTrialing,
      daysRemaining,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
