-- Stripe billing integration: customer id + minor alignment
-- Hardened to be safe if company_subscriptions does not exist yet

DO $$
BEGIN
  IF to_regclass('public.company_subscriptions') IS NOT NULL THEN
    ALTER TABLE public.company_subscriptions
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

    CREATE INDEX IF NOT EXISTS idx_company_subscriptions_stripe_customer
      ON public.company_subscriptions (stripe_customer_id);
  END IF;
END;
$$;

