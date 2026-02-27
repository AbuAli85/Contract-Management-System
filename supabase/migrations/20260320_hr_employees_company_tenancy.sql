-- ============================================================================
-- HR Employees: add company_id and tenant-scoped RLS
-- ============================================================================

-- 1. Add company_id column if missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'hr' AND table_name = 'employees'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'hr'
      AND table_name = 'employees'
      AND column_name = 'company_id'
  ) THEN
    ALTER TABLE hr.employees
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Best-effort backfill of company_id
DO $$
BEGIN
  -- Strategy A: infer company_id from user_roles via profiles where the employee has a user_id.
  -- Only attempt this when both hr.employees.user_id and user_roles.company_id exist.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'hr'
      AND table_name = 'employees'
      AND column_name = 'user_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'company_id'
  ) THEN
    -- If user_roles.is_active exists, prefer stricter mapping;
    -- otherwise, fall back to a simpler join without is_active filtering.
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_roles'
        AND column_name = 'is_active'
    ) THEN
      UPDATE hr.employees e
      SET company_id = ur.company_id
      FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id AND ur.is_active = TRUE
      WHERE e.user_id = p.id
        AND e.company_id IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.user_roles ur2
          WHERE ur2.user_id = ur.user_id
            AND ur2.is_active = TRUE
            AND ur2.company_id IS DISTINCT FROM ur.company_id
        );
    ELSE
      UPDATE hr.employees e
      SET company_id = ur.company_id
      FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE e.user_id = p.id
        AND e.company_id IS NULL;
    END IF;
  END IF;
END $$;

-- 3. Indexes to support tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_hr_employees_company_id
  ON hr.employees (company_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'hr'
      AND table_name = 'employees'
      AND column_name = 'manager_user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_hr_employees_company_manager_user
      ON hr.employees (company_id, manager_user_id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'hr'
      AND table_name = 'employees'
      AND column_name = 'manager_employee_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_hr_employees_company_manager_employee
      ON hr.employees (company_id, manager_employee_id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'hr'
      AND table_name = 'employees'
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_hr_employees_company_user
      ON hr.employees (company_id, user_id);
  END IF;
END $$;

-- 4. Tighten RLS to be tenant-aware for HR staff and managers
DO $$
BEGIN
  -- Ensure RLS is enabled
  ALTER TABLE hr.employees ENABLE ROW LEVEL SECURITY;

  -- Drop legacy policies if present
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'hr'
      AND tablename = 'employees'
      AND policyname = 'hr_employees_hr_all'
  ) THEN
    DROP POLICY hr_employees_hr_all ON hr.employees;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'hr'
      AND tablename = 'employees'
      AND policyname = 'hr_employees_self_read'
  ) THEN
    DROP POLICY hr_employees_self_read ON hr.employees;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'hr'
      AND tablename = 'employees'
      AND policyname = 'hr_employees_manager_read'
  ) THEN
    DROP POLICY hr_employees_manager_read ON hr.employees;
  END IF;

  -- HR staff (hr_admin/hr_staff) can manage employees for companies they belong to
  CREATE POLICY hr_employees_hr_all
    ON hr.employees
    FOR ALL
    USING (
      hr.is_hr_staff(auth.uid())
      AND company_id IS NOT NULL
      AND company_id = ANY(auth_user_company_ids())
    )
    WITH CHECK (
      hr.is_hr_staff(auth.uid())
      AND company_id IS NOT NULL
      AND company_id = ANY(auth_user_company_ids())
    );

  -- Employees can read their own record, but only within tenant-scoped employees
  CREATE POLICY hr_employees_self_read
    ON hr.employees
    FOR SELECT
    USING (
      company_id IS NOT NULL
      AND company_id = ANY(auth_user_company_ids())
      AND EXISTS (
        SELECT 1 FROM hr.user_profiles up
        WHERE up.user_id = auth.uid()
          AND up.employee_id = hr.employees.id
      )
    );

  -- Managers can read their direct reports, scoped by company
  CREATE POLICY hr_employees_manager_read
    ON hr.employees
    FOR SELECT
    USING (
      company_id IS NOT NULL
      AND company_id = ANY(auth_user_company_ids())
      AND hr.is_manager_of(auth.uid(), hr.employees.id)
    );
END $$;

