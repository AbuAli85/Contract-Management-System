-- Employer Team Management System
-- Creates comprehensive employer-employee relationship system with permissions, attendance, tasks, and targets

-- 1. Employer-Employee Relationship Table
CREATE TABLE IF NOT EXISTS employer_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_code TEXT, -- Optional employee ID/code
  job_title TEXT,
  department TEXT,
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'consultant')),
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'probation', 'on_leave', 'suspended', 'terminated')),
  hire_date DATE,
  termination_date DATE,
  reporting_manager_id UUID REFERENCES profiles(id),
  salary DECIMAL(12,2),
  currency TEXT DEFAULT 'OMR',
  work_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Ensure one employee can only be assigned to one employer at a time (unless terminated)
  CONSTRAINT employer_employees_unique_active UNIQUE (employee_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_employer_employees_employer_id ON employer_employees(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_employees_employee_id ON employer_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employer_employees_status ON employer_employees(employment_status);

-- 2. Employee Permissions (Custom permissions per employee)
CREATE TABLE IF NOT EXISTS employee_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  permission_id VARCHAR(255) NOT NULL, -- References permissions table or custom permission
  granted BOOLEAN DEFAULT true,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT employee_permissions_unique UNIQUE (employer_employee_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_permissions_employer_employee_id ON employee_permissions(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_permission_id ON employee_permissions(permission_id);

-- 3. Attendance Tracking (Enhanced for employer-employee context)
CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  location TEXT, -- office, remote, site, etc.
  method TEXT DEFAULT 'web' CHECK (method IN ('web', 'mobile', 'device', 'manual')),
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'leave', 'holiday')),
  total_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  break_duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT employee_attendance_unique_date UNIQUE (employer_employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_attendance_employer_employee_id ON employee_attendance(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_status ON employee_attendance(status);

-- 4. Tasks Management
CREATE TABLE IF NOT EXISTS employee_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'general' CHECK (task_type IN ('general', 'project', 'maintenance', 'support', 'training', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_tasks_employer_employee_id ON employee_tasks(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_status ON employee_tasks(status);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_due_date ON employee_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_priority ON employee_tasks(priority);

-- 5. Targets/Goals Management
CREATE TABLE IF NOT EXISTS employee_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_type TEXT DEFAULT 'performance' CHECK (target_type IN ('performance', 'sales', 'quality', 'efficiency', 'training', 'other')),
  target_value DECIMAL(12,2) NOT NULL, -- The goal value
  current_value DECIMAL(12,2) DEFAULT 0, -- Current progress
  unit TEXT, -- e.g., 'hours', 'tasks', 'revenue', 'percentage'
  period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_targets_employer_employee_id ON employee_targets(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_targets_status ON employee_targets(status);
CREATE INDEX IF NOT EXISTS idx_employee_targets_period ON employee_targets(start_date, end_date);

-- 6. Task Comments/Updates
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES employee_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  comment TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- Array of file URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- 7. Target Progress Tracking
CREATE TABLE IF NOT EXISTS target_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID NOT NULL REFERENCES employee_targets(id) ON DELETE CASCADE,
  recorded_value DECIMAL(12,2) NOT NULL,
  recorded_date DATE NOT NULL,
  recorded_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT target_progress_unique_date UNIQUE (target_id, recorded_date)
);

CREATE INDEX IF NOT EXISTS idx_target_progress_target_id ON target_progress(target_id);
CREATE INDEX IF NOT EXISTS idx_target_progress_date ON target_progress(recorded_date);

-- Enable Row Level Security
ALTER TABLE employer_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Employers can manage their own employees
CREATE POLICY "Employers can view their employees"
  ON employer_employees FOR SELECT
  USING (
    employer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'manager')
    )
  );

CREATE POLICY "Employers can manage their employees"
  ON employer_employees FOR ALL
  USING (
    employer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Employees can view their own records
CREATE POLICY "Employees can view their own records"
  ON employer_employees FOR SELECT
  USING (employee_id = auth.uid());

-- Similar policies for other tables
CREATE POLICY "Employers can manage employee permissions"
  ON employee_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_permissions.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view their own permissions"
  ON employee_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_permissions.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- Attendance policies
CREATE POLICY "Employers can manage employee attendance"
  ON employee_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_attendance.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view their own attendance"
  ON employee_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_attendance.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Employers can manage employee tasks"
  ON employee_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_tasks.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view and update their own tasks"
  ON employee_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_tasks.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own tasks"
  ON employee_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_tasks.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- Targets policies
CREATE POLICY "Employers can manage employee targets"
  ON employee_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_targets.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view and update their own targets"
  ON employee_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_targets.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own target progress"
  ON employee_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_targets.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_employer_employees_updated_at
  BEFORE UPDATE ON employer_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_attendance_updated_at
  BEFORE UPDATE ON employee_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_tasks_updated_at
  BEFORE UPDATE ON employee_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_targets_updated_at
  BEFORE UPDATE ON employee_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE employer_employees IS 'Links employers to their team members/employees';
COMMENT ON TABLE employee_permissions IS 'Custom permissions assigned to employees by their employer';
COMMENT ON TABLE employee_attendance IS 'Attendance tracking for employees';
COMMENT ON TABLE employee_tasks IS 'Task management for employees';
COMMENT ON TABLE employee_targets IS 'Targets/goals management for employees';
COMMENT ON TABLE task_comments IS 'Comments and updates on tasks';
COMMENT ON TABLE target_progress IS 'Progress tracking for targets';

