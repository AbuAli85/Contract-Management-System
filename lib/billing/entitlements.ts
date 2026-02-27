import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';

type EntitlementResource = 'users' | 'contracts' | 'promoters' | 'workflows' | 'storage_gb';

interface PlanInfo {
  name: string;
  displayName: string;
  features: Record<string, any>;
}

interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number | null;
  plan?: PlanInfo;
}

const INTERNAL_MODE = process.env.MODE === 'INTERNAL';

/**
 * Returns the current company's subscription plan (or an internal enterprise plan).
 * Uses existing company_subscriptions + subscription_plans schema.
 */
export async function getCompanyPlan(
  companyId?: string | null
): Promise<PlanInfo | null> {
  const supabase = await createClient();

  let effectiveCompanyId = companyId;
  if (!effectiveCompanyId) {
    const { companyId: resolvedCompanyId } = await getCompanyRole(supabase);
    effectiveCompanyId = resolvedCompanyId;
  }

  if (!effectiveCompanyId) {
    return null;
  }

  // In INTERNAL mode, treat everything as enterprise-level
  if (INTERNAL_MODE) {
    return {
      name: 'enterprise_internal',
      displayName: 'Enterprise (Internal)',
      features: {
        workflow: true,
        api_access: true,
        sso: true,
        custom_roles: true,
      },
    };
  }

  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select(
      `
      id,
      status,
      subscription_plans (
        name,
        display_name,
        features
      )
    `
    )
    .eq('company_id', effectiveCompanyId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription || !(subscription as any).subscription_plans) {
    return null;
  }

  const plan = (subscription as any).subscription_plans;
  return {
    name: plan.name,
    displayName: plan.display_name,
    features: plan.features || {},
  };
}

/**
 * Asserts that the company is entitled to perform an action on a resource.
 * Wraps the existing check_plan_limit() Postgres function where possible.
 *
 * Throws an Error with a clear message if not allowed.
 */
export async function assertEntitlement(
  companyId: string | null,
  resource: EntitlementResource,
  increment: number = 1
): Promise<void> {
  const supabase = await createClient();

  let effectiveCompanyId = companyId;
  if (!effectiveCompanyId) {
    const { companyId: resolvedCompanyId } = await getCompanyRole(supabase);
    effectiveCompanyId = resolvedCompanyId;
  }

  if (!effectiveCompanyId) {
    throw new Error('No active company selected; cannot enforce entitlements.');
  }

  // INTERNAL mode: still enforce features, but ignore hard limits
  if (INTERNAL_MODE) {
    const plan = await getCompanyPlan(effectiveCompanyId);
    if (resource === 'workflows' && plan && plan.features?.workflow === false) {
      throw new Error('Workflows are not enabled for this internal plan.');
    }
    // Otherwise, allow; internal plans are considered effectively unlimited
    return;
  }

  // For users, contracts, promoters, and storage_gb, use check_plan_limit()
  const supportedResources: EntitlementResource[] = [
    'users',
    'contracts',
    'promoters',
    'storage_gb',
  ];

  if (!supportedResources.includes(resource)) {
    // For workflows or other features, just rely on features flags
    const plan = await getCompanyPlan(effectiveCompanyId);
    if (resource === 'workflows') {
      if (!plan || plan.features?.workflow !== true) {
        throw new Error('Workflows are not enabled for your current plan.');
      }
    }
    return;
  }

  const { data, error } = await supabase.rpc('check_plan_limit', {
    p_company_id: effectiveCompanyId,
    p_resource: resource,
    p_increment: increment,
  });

  if (error) {
    // Fail open on RPC errors, but log via console; adjust if you prefer strict
    // eslint-disable-next-line no-console
    console.error('check_plan_limit RPC failed', error);
    return;
  }

  const result = data as EntitlementResult;
  if (!result || result.allowed === false) {
    const message =
      result?.reason ||
      `Plan limit reached for ${resource}. Please upgrade your subscription.`;
    throw new Error(message);
  }
}

