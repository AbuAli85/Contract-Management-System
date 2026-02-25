-- =============================================================================
-- Week 3-4: Workflow Engine
-- SmartPRO War Plan — Phase 2
-- =============================================================================
-- Creates a generic, reusable workflow engine that can be applied to any
-- entity (contracts, approvals, attendance, tasks, leave requests, etc.)
-- without duplicating state-machine logic per module.
--
-- Core concepts:
--   workflow_definitions  — named state machines (e.g. "contract_approval")
--   workflow_states       — valid states within a definition
--   workflow_transitions  — allowed (from_state → to_state) with conditions
--   workflow_instances    — one row per entity being tracked
--   workflow_events       — immutable audit log of every transition
--   workflow_transition() — the single entry point for all state changes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. workflow_definitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                  -- e.g. 'contract_approval'
  entity_type   TEXT NOT NULL,                  -- e.g. 'contract', 'leave_request'
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

-- ---------------------------------------------------------------------------
-- 2. workflow_states
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id     UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,              -- e.g. 'draft', 'pending_approval'
  label             TEXT NOT NULL,              -- Human-readable label
  is_initial        BOOLEAN NOT NULL DEFAULT FALSE,
  is_terminal       BOOLEAN NOT NULL DEFAULT FALSE,
  sla_hours         INTEGER,                    -- Optional SLA in hours
  notify_roles      TEXT[],                     -- Roles to notify on entry
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (definition_id, name)
);

-- ---------------------------------------------------------------------------
-- 3. workflow_transitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id     UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  from_state        TEXT NOT NULL,
  to_state          TEXT NOT NULL,
  trigger_name      TEXT NOT NULL,              -- e.g. 'submit', 'approve', 'reject'
  allowed_roles     TEXT[],                     -- NULL = any role
  requires_comment  BOOLEAN NOT NULL DEFAULT FALSE,
  auto_trigger      BOOLEAN NOT NULL DEFAULT FALSE, -- true = system-triggered
  condition_sql     TEXT,                       -- Optional SQL predicate (advanced)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (definition_id, from_state, trigger_name)
);

-- ---------------------------------------------------------------------------
-- 4. workflow_instances
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  definition_id   UUID NOT NULL REFERENCES workflow_definitions(id),
  entity_type     TEXT NOT NULL,                -- e.g. 'contract'
  entity_id       UUID NOT NULL,                -- FK to the entity (polymorphic)
  current_state   TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,                  -- Computed from SLA
  assigned_to     UUID REFERENCES profiles(id), -- Current assignee
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id)               -- One active workflow per entity
);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_company
  ON workflow_instances (company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity
  ON workflow_instances (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_state
  ON workflow_instances (current_state);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_due
  ON workflow_instances (due_at) WHERE due_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. workflow_events (immutable audit log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_state      TEXT NOT NULL,
  to_state        TEXT NOT NULL,
  trigger_name    TEXT NOT NULL,
  triggered_by    UUID REFERENCES profiles(id),
  comment         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_instance
  ON workflow_events (instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_company
  ON workflow_events (company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created
  ON workflow_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- 6. workflow_transition() — the single entry point for all state changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION workflow_transition(
  p_instance_id   UUID,
  p_trigger_name  TEXT,
  p_triggered_by  UUID,
  p_comment       TEXT DEFAULT NULL,
  p_metadata      JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance      workflow_instances%ROWTYPE;
  v_transition    workflow_transitions%ROWTYPE;
  v_to_state      workflow_states%ROWTYPE;
  v_event_id      UUID;
  v_user_roles    TEXT[];
BEGIN
  -- 1. Load the instance
  SELECT * INTO v_instance
  FROM workflow_instances
  WHERE id = p_instance_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workflow instance not found');
  END IF;

  -- 2. Find the matching transition
  SELECT * INTO v_transition
  FROM workflow_transitions
  WHERE definition_id  = v_instance.definition_id
    AND from_state     = v_instance.current_state
    AND trigger_name   = p_trigger_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format(
        'No transition "%s" from state "%s"',
        p_trigger_name, v_instance.current_state
      )
    );
  END IF;

  -- 3. Check role authorization
  IF v_transition.allowed_roles IS NOT NULL THEN
    SELECT ARRAY_AGG(ur.role) INTO v_user_roles
    FROM user_roles ur
    WHERE ur.user_id   = p_triggered_by
      AND ur.company_id = v_instance.company_id
      AND ur.is_active  = TRUE;

    IF NOT (v_user_roles && v_transition.allowed_roles) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient role for this transition'
      );
    END IF;
  END IF;

  -- 4. Enforce comment requirement
  IF v_transition.requires_comment AND (p_comment IS NULL OR p_comment = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A comment is required for this transition'
    );
  END IF;

  -- 5. Load the destination state (for SLA and terminal flag)
  SELECT * INTO v_to_state
  FROM workflow_states
  WHERE definition_id = v_instance.definition_id
    AND name          = v_transition.to_state;

  -- 6. Write the immutable event
  INSERT INTO workflow_events (
    instance_id, company_id, from_state, to_state,
    trigger_name, triggered_by, comment, metadata
  ) VALUES (
    p_instance_id, v_instance.company_id,
    v_instance.current_state, v_transition.to_state,
    p_trigger_name, p_triggered_by, p_comment, p_metadata
  )
  RETURNING id INTO v_event_id;

  -- 7. Advance the instance
  UPDATE workflow_instances
  SET
    current_state = v_transition.to_state,
    completed_at  = CASE WHEN v_to_state.is_terminal THEN NOW() ELSE NULL END,
    due_at        = CASE
                      WHEN v_to_state.sla_hours IS NOT NULL
                      THEN NOW() + (v_to_state.sla_hours || ' hours')::INTERVAL
                      ELSE NULL
                    END,
    updated_at    = NOW()
  WHERE id = p_instance_id;

  RETURN jsonb_build_object(
    'success',    true,
    'event_id',   v_event_id,
    'from_state', v_instance.current_state,
    'to_state',   v_transition.to_state
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. workflow_start() — convenience function to create a new instance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION workflow_start(
  p_company_id    UUID,
  p_definition_name TEXT,
  p_entity_type   TEXT,
  p_entity_id     UUID,
  p_created_by    UUID,
  p_metadata      JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_definition    workflow_definitions%ROWTYPE;
  v_initial_state workflow_states%ROWTYPE;
  v_instance_id   UUID;
BEGIN
  -- Find the definition
  SELECT * INTO v_definition
  FROM workflow_definitions
  WHERE company_id = p_company_id
    AND name       = p_definition_name
    AND is_active  = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Workflow definition "%s" not found', p_definition_name)
    );
  END IF;

  -- Find the initial state
  SELECT * INTO v_initial_state
  FROM workflow_states
  WHERE definition_id = v_definition.id
    AND is_initial    = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No initial state defined for this workflow'
    );
  END IF;

  -- Create the instance (upsert — re-use if already started)
  INSERT INTO workflow_instances (
    company_id, definition_id, entity_type, entity_id,
    current_state, created_by, metadata
  ) VALUES (
    p_company_id, v_definition.id, p_entity_type, p_entity_id,
    v_initial_state.name, p_created_by, p_metadata
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET updated_at = NOW()
  RETURNING id INTO v_instance_id;

  RETURN jsonb_build_object(
    'success',       true,
    'instance_id',   v_instance_id,
    'initial_state', v_initial_state.name
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE workflow_definitions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_states        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events        ENABLE ROW LEVEL SECURITY;

-- workflow_definitions: company-scoped read, admin/manager write
CREATE POLICY "workflow_definitions_read" ON workflow_definitions
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "workflow_definitions_write" ON workflow_definitions
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.role IN ('admin', 'manager')
        AND ur.is_active = TRUE
    )
  );

-- workflow_states / transitions: inherit from definition's company
CREATE POLICY "workflow_states_read" ON workflow_states
  FOR SELECT USING (
    definition_id IN (
      SELECT wd.id FROM workflow_definitions wd
      WHERE wd.company_id IN (
        SELECT ur.company_id FROM user_roles ur
        WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
          AND ur.is_active = TRUE
      )
    )
  );

CREATE POLICY "workflow_transitions_read" ON workflow_transitions
  FOR SELECT USING (
    definition_id IN (
      SELECT wd.id FROM workflow_definitions wd
      WHERE wd.company_id IN (
        SELECT ur.company_id FROM user_roles ur
        WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
          AND ur.is_active = TRUE
      )
    )
  );

-- workflow_instances: company-scoped
CREATE POLICY "workflow_instances_read" ON workflow_instances
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "workflow_instances_write" ON workflow_instances
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

-- workflow_events: company-scoped, insert-only for non-admins
CREATE POLICY "workflow_events_read" ON workflow_events
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

CREATE POLICY "workflow_events_insert" ON workflow_events
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND ur.is_active = TRUE
    )
  );

-- No UPDATE or DELETE on workflow_events — immutable audit log
-- (Only service-role can modify via admin client)

-- ---------------------------------------------------------------------------
-- 9. Seed default workflow definitions for contracts
--    (These are templates — each company can customise their own copy)
-- ---------------------------------------------------------------------------
-- NOTE: These inserts use a placeholder company_id that must be replaced
-- with real company IDs via the application's onboarding flow.
-- The seed is commented out here and should be run via the onboarding API.

-- Example of what the onboarding API should insert:
-- SELECT workflow_start(
--   '<company_id>',
--   'contract_approval',
--   'contract',
--   '<contract_id>',
--   '<user_id>'
-- );
