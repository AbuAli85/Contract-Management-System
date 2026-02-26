-- ============================================================================
-- Tasks Engine Schema
-- ============================================================================
-- This migration introduces:
--   1) tasks           — tenant-scoped task records
--   2) task_events     — audit trail of task actions
--   3) RLS policies    — tenant-based read; role-based writes; assignee status updates
--   4) Update trigger  — enforces "assigned_to can update status only" for
--                        non-privileged users
--
-- Tenancy & roles:
--   - Tenant membership: public.user_roles(user_id, company_id, role, is_active)
--   - Identity mapping:  public.profiles(user_id) -> user_roles.user_id
--   - Privileged roles for write: 'owner', 'admin', 'manager', 'hr'
-- ============================================================================

-- ============================================================================
-- 1. tasks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_company_entity
  ON public.tasks (company_id, status, priority, due_date);

-- ============================================================================
-- 2. task_events table (audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_events_company_task_created
  ON public.task_events (company_id, task_id, created_at);

-- ============================================================================
-- 3. RLS policies
-- ============================================================================
-- Conventions:
--   - "Tenant members" (for SELECT): any active user_roles row in the company.
--   - "Privileged writers" (INSERT/UPDATE/DELETE): user_roles.role IN
--       ('owner','admin','manager','hr') for the task's company.
--   - Assignee status updates:
--       * assigned_to can UPDATE their tasks
--       * A trigger (see section 4) enforces that only status changes are allowed
--         for non-privileged assignees.
-- ============================================================================

ALTER TABLE public.tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if they exist
DROP POLICY IF EXISTS "tasks_select_tenant" ON public.tasks;
DROP POLICY IF EXISTS "tasks_write_privileged" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assignee_update_status" ON public.tasks;

DROP POLICY IF EXISTS "task_events_select_tenant" ON public.task_events;
DROP POLICY IF EXISTS "task_events_write_privileged" ON public.task_events;

-- --------------------------------------------------------------------------
-- 3.1 tasks policies
-- --------------------------------------------------------------------------

-- Tenant members can read tasks in their company
CREATE POLICY "tasks_select_tenant"
  ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = tasks.company_id
        AND ur.is_active = TRUE
    )
  );

-- Privileged roles can INSERT/UPDATE/DELETE tasks in their company
CREATE POLICY "tasks_write_privileged"
  ON public.tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = tasks.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('owner', 'admin', 'manager', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = tasks.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('owner', 'admin', 'manager', 'hr')
    )
  );

-- Assignee can issue UPDATEs on their own tasks (columns restricted by trigger)
CREATE POLICY "tasks_assignee_update_status"
  ON public.tasks
  FOR UPDATE
  USING (
    assigned_to = auth.uid()
  )
  WITH CHECK (
    assigned_to = auth.uid()
  );

-- --------------------------------------------------------------------------
-- 3.2 task_events policies
-- --------------------------------------------------------------------------

-- Tenant members can read task_events
CREATE POLICY "task_events_select_tenant"
  ON public.task_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = task_events.company_id
        AND ur.is_active = TRUE
    )
  );

-- Privileged roles can insert/delete task_events (service_role is handled at DB level)
CREATE POLICY "task_events_write_privileged"
  ON public.task_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = task_events.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('owner', 'admin', 'manager', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = task_events.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('owner', 'admin', 'manager', 'hr')
    )
  );

-- ============================================================================
-- 4. Update trigger: restrict non-privileged assignees to status-only updates
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_task_update_permissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_privileged BOOLEAN;
BEGIN
  -- Only enforce on UPDATE
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Service role is fully trusted
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Determine if current user has a privileged role for this task's company
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE p.user_id = auth.uid()
      AND ur.company_id = NEW.company_id
      AND ur.is_active = TRUE
      AND ur.role IN ('owner', 'admin', 'manager', 'hr')
  )
  INTO v_is_privileged;

  -- Privileged users can update freely (RLS already restricts scope)
  IF v_is_privileged THEN
    RETURN NEW;
  END IF;

  -- Non-privileged users: only allow the assignee to change status (and nothing else)
  IF NEW.assigned_to = auth.uid() THEN
    IF
      -- status may change
      NEW.status IS DISTINCT FROM OLD.status
      -- all other columns must remain unchanged
      AND NEW.company_id IS NOT DISTINCT FROM OLD.company_id
      AND NEW.title       IS NOT DISTINCT FROM OLD.title
      AND NEW.description IS NOT DISTINCT FROM OLD.description
      AND NEW.priority    IS NOT DISTINCT FROM OLD.priority
      AND NEW.due_date    IS NOT DISTINCT FROM OLD.due_date
      AND NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to
      AND NEW.related_contract_id IS NOT DISTINCT FROM OLD.related_contract_id
      AND NEW.created_by  IS NOT DISTINCT FROM OLD.created_by
      AND NEW.created_at  IS NOT DISTINCT FROM OLD.created_at
    THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Non-privileged assignee may only update task status'
        USING HINT = 'Only the status field can be changed by the assigned user.';
    END IF;
  END IF;

  -- Non-privileged and not assignee: block update entirely (RLS should already catch most cases)
  RAISE EXCEPTION 'Insufficient permissions to update this task';
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_task_update_permissions ON public.tasks;

CREATE TRIGGER trg_enforce_task_update_permissions
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_task_update_permissions();

