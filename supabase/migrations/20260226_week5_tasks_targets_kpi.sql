-- =============================================================================
-- Week 5-6: Tasks Engine, Targets Engine, Compliance Alerts, KPI Dashboard
-- SmartPRO War Plan — Phase 3
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TASKS ENGINE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  entity_type     TEXT,                           -- optional: 'contract', 'promoter', etc.
  entity_id       UUID,                           -- optional: linked entity
  status          TEXT NOT NULL DEFAULT 'backlog', -- mirrors workflow states
  priority        TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  due_date        DATE,
  assigned_to     UUID REFERENCES profiles(id),
  created_by      UUID REFERENCES profiles(id),
  tags            TEXT[] NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_company       ON tasks (company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned      ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_due           ON tasks (due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_entity        ON tasks (entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments (task_id);

-- Task attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. TARGETS ENGINE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS target_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  metric_key      TEXT NOT NULL,                  -- e.g. 'contracts_signed', 'revenue_collected'
  target_type     TEXT NOT NULL DEFAULT 'count',  -- count | sum | percentage | average
  period_type     TEXT NOT NULL DEFAULT 'monthly',-- daily | weekly | monthly | quarterly | yearly
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, metric_key, period_type)
);

CREATE TABLE IF NOT EXISTS target_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  definition_id     UUID NOT NULL REFERENCES target_definitions(id) ON DELETE CASCADE,
  assignee_type     TEXT NOT NULL DEFAULT 'user',  -- user | team | company
  assignee_id       UUID,                          -- user/team id (NULL = company-wide)
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  target_value      NUMERIC(15,4) NOT NULL,
  current_value     NUMERIC(15,4) NOT NULL DEFAULT 0,
  achieved_at       TIMESTAMPTZ,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_assignments_company   ON target_assignments (company_id);
CREATE INDEX IF NOT EXISTS idx_target_assignments_assignee  ON target_assignments (assignee_type, assignee_id);
CREATE INDEX IF NOT EXISTS idx_target_assignments_period    ON target_assignments (period_start, period_end);

-- Progress snapshots (append-only, used for trend charts)
CREATE TABLE IF NOT EXISTS target_progress_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES target_assignments(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  value           NUMERIC(15,4) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_snapshots_assignment ON target_progress_snapshots (assignment_id, snapshot_date DESC);

-- ---------------------------------------------------------------------------
-- 3. COMPLIANCE ALERTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS compliance_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  rule_type       TEXT NOT NULL,                  -- contract_expiry | document_expiry | iqama_expiry | target_miss | sla_breach
  entity_type     TEXT,                           -- 'contract', 'promoter', 'task', etc.
  condition_sql   TEXT,                           -- SQL fragment evaluated server-side
  severity        TEXT NOT NULL DEFAULT 'warning',-- info | warning | critical
  notify_roles    TEXT[] NOT NULL DEFAULT '{}',
  advance_days    INTEGER NOT NULL DEFAULT 30,    -- alert this many days before the event
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_id         UUID REFERENCES compliance_rules(id) ON DELETE SET NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'warning',
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  due_date        DATE,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, rule_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_company   ON compliance_alerts (company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_entity    ON compliance_alerts (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_severity  ON compliance_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_resolved  ON compliance_alerts (resolved_at) WHERE resolved_at IS NULL;

-- ---------------------------------------------------------------------------
-- 4. KPI DASHBOARD — metric snapshots
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_key      TEXT NOT NULL,                  -- e.g. 'active_contracts', 'expiring_soon_30d'
  metric_value    NUMERIC(15,4) NOT NULL,
  dimension_key   TEXT,                           -- optional: 'department', 'region', 'promoter_id'
  dimension_value TEXT,
  snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_company  ON kpi_snapshots (company_id, metric_key, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_metric   ON kpi_snapshots (metric_key, snapshot_at DESC);

-- ---------------------------------------------------------------------------
-- 5. KPI REFRESH FUNCTION — called by a pg_cron job or Edge Function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_kpi_snapshots(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Active contracts
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'active_contracts', COUNT(*)
  FROM contracts
  WHERE company_id = p_company_id AND status = 'active';

  -- Contracts expiring in 30 days
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'expiring_soon_30d', COUNT(*)
  FROM contracts
  WHERE company_id = p_company_id
    AND status = 'active'
    AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

  -- Contracts expiring in 60 days
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'expiring_soon_60d', COUNT(*)
  FROM contracts
  WHERE company_id = p_company_id
    AND status = 'active'
    AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days';

  -- Open compliance alerts
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'open_compliance_alerts', COUNT(*)
  FROM compliance_alerts
  WHERE company_id = p_company_id AND resolved_at IS NULL;

  -- Critical compliance alerts
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'critical_compliance_alerts', COUNT(*)
  FROM compliance_alerts
  WHERE company_id = p_company_id AND resolved_at IS NULL AND severity = 'critical';

  -- Open tasks
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'open_tasks', COUNT(*)
  FROM tasks
  WHERE company_id = p_company_id AND status NOT IN ('done', 'cancelled');

  -- Overdue tasks
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'overdue_tasks', COUNT(*)
  FROM tasks
  WHERE company_id = p_company_id
    AND status NOT IN ('done', 'cancelled')
    AND due_date < CURRENT_DATE;

  -- Active promoters
  INSERT INTO kpi_snapshots (company_id, metric_key, metric_value)
  SELECT p_company_id, 'active_promoters', COUNT(*)
  FROM promoters
  WHERE company_id = p_company_id AND status = 'active';
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. COMPLIANCE ALERT GENERATION FUNCTION
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_compliance_alerts(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Contract expiry alerts (30-day window)
  INSERT INTO compliance_alerts (
    company_id, entity_type, entity_id, severity, title, message, due_date
  )
  SELECT
    p_company_id,
    'contract',
    c.id,
    CASE
      WHEN c.end_date <= CURRENT_DATE + INTERVAL '7 days'  THEN 'critical'
      WHEN c.end_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'warning'
      ELSE 'info'
    END,
    'Contract Expiring Soon',
    format('Contract "%s" expires on %s', c.contract_number, c.end_date),
    c.end_date
  FROM contracts c
  WHERE c.company_id = p_company_id
    AND c.status = 'active'
    AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ON CONFLICT (company_id, rule_id, entity_type, entity_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. RLS POLICIES
-- ---------------------------------------------------------------------------

ALTER TABLE tasks                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_definitions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_assignments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_progress_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots                ENABLE ROW LEVEL SECURITY;

-- Helper: returns the profile id for the current auth user
-- (used inline to avoid function call overhead in every policy)

-- TASKS
CREATE POLICY "tasks_company_read" ON tasks
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "tasks_company_write" ON tasks
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

-- TASK COMMENTS
CREATE POLICY "task_comments_read" ON task_comments
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "task_comments_write" ON task_comments
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

-- TASK ATTACHMENTS
CREATE POLICY "task_attachments_read" ON task_attachments
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "task_attachments_write" ON task_attachments
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

-- TARGET DEFINITIONS
CREATE POLICY "target_definitions_read" ON target_definitions
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "target_definitions_write" ON target_definitions
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role IN ('admin', 'manager')
        AND ur.is_active = TRUE
    )
  );

-- TARGET ASSIGNMENTS
CREATE POLICY "target_assignments_read" ON target_assignments
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "target_assignments_write" ON target_assignments
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role IN ('admin', 'manager')
        AND ur.is_active = TRUE
    )
  );

-- TARGET PROGRESS SNAPSHOTS
CREATE POLICY "target_snapshots_read" ON target_progress_snapshots
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

-- COMPLIANCE RULES
CREATE POLICY "compliance_rules_read" ON compliance_rules
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "compliance_rules_write" ON compliance_rules
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role IN ('admin')
        AND ur.is_active = TRUE
    )
  );

-- COMPLIANCE ALERTS
CREATE POLICY "compliance_alerts_read" ON compliance_alerts
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "compliance_alerts_write" ON compliance_alerts
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role IN ('admin', 'manager')
        AND ur.is_active = TRUE
    )
  );

-- KPI SNAPSHOTS
CREATE POLICY "kpi_snapshots_read" ON kpi_snapshots
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );
