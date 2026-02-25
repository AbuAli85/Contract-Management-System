-- =============================================================================
-- Week 7-8: Subscription System, Plan Enforcement, Enterprise Security
-- SmartPRO War Plan — Phase 4
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SUBSCRIPTION PLANS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,           -- 'starter' | 'professional' | 'enterprise'
  display_name    TEXT NOT NULL,
  description     TEXT,
  price_monthly   NUMERIC(10,2),
  price_yearly    NUMERIC(10,2),
  currency        TEXT NOT NULL DEFAULT 'USD',
  max_users       INTEGER,                        -- NULL = unlimited
  max_contracts   INTEGER,
  max_promoters   INTEGER,
  max_storage_gb  NUMERIC(10,2),
  features        JSONB NOT NULL DEFAULT '{}',    -- feature flags
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_contracts, max_promoters, max_storage_gb, features, sort_order)
VALUES
  ('starter',      'Starter',      'For small teams',         49,   490,   5,    100,  50,   5,    '{"workflow":false,"api_access":false,"sso":false,"custom_roles":false}', 1),
  ('professional', 'Professional', 'For growing businesses',  149,  1490,  25,   500,  250,  25,   '{"workflow":true,"api_access":true,"sso":false,"custom_roles":false}',  2),
  ('enterprise',   'Enterprise',   'For large organizations', NULL, NULL,  NULL, NULL, NULL, NULL, '{"workflow":true,"api_access":true,"sso":true,"custom_roles":true}',     3)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. COMPANY SUBSCRIPTIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id             UUID NOT NULL REFERENCES subscription_plans(id),
  status              TEXT NOT NULL DEFAULT 'active',  -- active | past_due | cancelled | trialing
  billing_cycle       TEXT NOT NULL DEFAULT 'monthly', -- monthly | yearly
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  trial_ends_at       TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  external_id         TEXT,                            -- Stripe subscription ID
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id)                                  -- One active subscription per company
);

CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON company_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_period ON company_subscriptions (current_period_end);

-- ---------------------------------------------------------------------------
-- 3. PLAN ENFORCEMENT FUNCTION
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_plan_limit(
  p_company_id  UUID,
  p_resource    TEXT,   -- 'users' | 'contracts' | 'promoters' | 'storage_gb'
  p_increment   NUMERIC DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan    subscription_plans%ROWTYPE;
  v_sub     company_subscriptions%ROWTYPE;
  v_current NUMERIC;
  v_limit   NUMERIC;
BEGIN
  -- Get active subscription
  SELECT cs.*, sp.*
  INTO v_sub
  FROM company_subscriptions cs
  JOIN subscription_plans sp ON sp.id = cs.plan_id
  WHERE cs.company_id = p_company_id
    AND cs.status IN ('active', 'trialing')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'No active subscription');
  END IF;

  -- Get the plan
  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_sub.plan_id;

  -- Check the specific resource
  CASE p_resource
    WHEN 'users' THEN
      v_limit := v_plan.max_users;
      SELECT COUNT(*) INTO v_current
      FROM user_roles
      WHERE company_id = p_company_id AND is_active = TRUE;

    WHEN 'contracts' THEN
      v_limit := v_plan.max_contracts;
      SELECT COUNT(*) INTO v_current
      FROM contracts
      WHERE company_id = p_company_id AND status != 'terminated';

    WHEN 'promoters' THEN
      v_limit := v_plan.max_promoters;
      SELECT COUNT(*) INTO v_current
      FROM promoters
      WHERE company_id = p_company_id AND status = 'active';

    ELSE
      RETURN jsonb_build_object('allowed', true, 'reason', 'Unknown resource — allowed by default');
  END CASE;

  -- NULL limit = unlimited
  IF v_limit IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'current', v_current, 'limit', NULL);
  END IF;

  IF (v_current + p_increment) > v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  format('Plan limit reached: %s/%s %s', v_current, v_limit, p_resource),
      'current', v_current,
      'limit',   v_limit
    );
  END IF;

  RETURN jsonb_build_object('allowed', true, 'current', v_current, 'limit', v_limit);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. AUDIT LOG (enterprise security)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,                  -- e.g. 'contract.create', 'user.login'
  entity_type     TEXT,
  entity_id       UUID,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  request_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company   ON audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user      ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity    ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action    ON audit_logs (action, created_at DESC);

-- Partition audit_logs by month (optional — enable when volume warrants it)
-- CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- ---------------------------------------------------------------------------
-- 5. AUDIT TRIGGER FUNCTION
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id  UUID;
  v_user_id     UUID;
BEGIN
  -- Extract company_id from the row if present
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_company_id := (OLD.company_id)::UUID;
    ELSE
      v_company_id := (NEW.company_id)::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_company_id := NULL;
  END;

  -- Get current user's profile id
  SELECT id INTO v_user_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;

  INSERT INTO audit_logs (
    company_id, user_id, action, entity_type, entity_id,
    old_values, new_values
  ) VALUES (
    v_company_id,
    v_user_id,
    lower(TG_TABLE_NAME) || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE TG_OP WHEN 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE TG_OP WHEN 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );

  RETURN NULL; -- AFTER trigger
END;
$$;

-- Attach audit triggers to critical tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['contracts', 'promoters', 'documents', 'user_roles', 'company_subscriptions']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS audit_%I ON %I;
       CREATE TRIGGER audit_%I
         AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();',
      t, t, t, t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. API KEYS (for enterprise integrations)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,           -- bcrypt/sha256 hash of the actual key
  key_prefix      TEXT NOT NULL,                  -- first 8 chars for display (e.g. 'sk_live_')
  scopes          TEXT[] NOT NULL DEFAULT '{}',   -- ['read:contracts', 'write:contracts']
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys (company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash    ON api_keys (key_hash);

-- ---------------------------------------------------------------------------
-- 7. SESSION MANAGEMENT (track active sessions for security dashboard)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  session_token   TEXT NOT NULL UNIQUE,           -- hashed Supabase session token
  ip_address      INET,
  user_agent      TEXT,
  location        TEXT,                           -- geo-derived from IP
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user   ON user_sessions (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (is_active, last_active_at DESC);

-- ---------------------------------------------------------------------------
-- 8. RLS POLICIES
-- ---------------------------------------------------------------------------

ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions   ENABLE ROW LEVEL SECURITY;

-- Audit logs: admin-only read, no direct write (trigger-only)
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role = 'admin'
        AND ur.is_active = TRUE
    )
  );

-- API keys: company-scoped, admin/manager write
CREATE POLICY "api_keys_read" ON api_keys
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role IN ('admin', 'manager')
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "api_keys_write" ON api_keys
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role = 'admin'
        AND ur.is_active = TRUE
    )
  );

-- User sessions: own sessions only (or admin sees all)
CREATE POLICY "user_sessions_own" ON user_sessions
  FOR SELECT USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role = 'admin'
        AND ur.is_active = TRUE
    )
  );

-- Company subscriptions: admin read
CREATE POLICY "company_subscriptions_read" ON company_subscriptions
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "company_subscriptions_write" ON company_subscriptions
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role = 'admin'
        AND ur.is_active = TRUE
    )
  );
