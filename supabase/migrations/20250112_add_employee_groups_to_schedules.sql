-- Migration: Add Employee Groups and Enhanced Assignment System
-- Date: 2025-01-12
-- Description: Add employee groups, location-based grouping, and formal assignment system

-- Table for employee groups (location-based or custom groups)
CREATE TABLE IF NOT EXISTS employee_attendance_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Group Configuration
  name VARCHAR(255) NOT NULL, -- e.g., "Grand Mall Muscat Team", "City Center Team"
  description TEXT,
  group_type TEXT DEFAULT 'location' CHECK (group_type IN ('location', 'department', 'custom', 'project')),
  
  -- Location Association (if location-based)
  office_location_id UUID REFERENCES office_locations(id) ON DELETE SET NULL,
  
  -- Department/Project Association (if applicable)
  department_name TEXT,
  project_name TEXT,
  
  -- Group Settings
  is_active BOOLEAN DEFAULT true,
  default_check_in_time TIME, -- Default check-in time for this group
  default_check_out_time TIME, -- Default check-out time for this group
  
  -- Metadata
  employee_count INTEGER DEFAULT 0, -- Cached count
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT employee_groups_name_unique UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_employee_groups_company_id ON employee_attendance_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_groups_office_location ON employee_attendance_groups(office_location_id);
CREATE INDEX IF NOT EXISTS idx_employee_groups_type ON employee_attendance_groups(group_type);

-- Table to link employees to groups
CREATE TABLE IF NOT EXISTS employee_group_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES employee_attendance_groups(id) ON DELETE CASCADE NOT NULL,
  employer_employee_id UUID REFERENCES employer_employees(id) ON DELETE CASCADE NOT NULL,
  
  -- Assignment Settings
  is_primary BOOLEAN DEFAULT true, -- Primary group assignment
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  
  -- Ensure one employee can only be in a group once
  CONSTRAINT employee_group_unique UNIQUE (group_id, employer_employee_id)
);

CREATE INDEX IF NOT EXISTS idx_group_assignments_group_id ON employee_group_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_group_assignments_employee_id ON employee_group_assignments(employer_employee_id);

-- Update attendance_link_schedules to support groups
DO $$
BEGIN
  -- Add employee_group_ids column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_link_schedules'
      AND column_name = 'employee_group_ids'
  ) THEN
    ALTER TABLE attendance_link_schedules 
      ADD COLUMN employee_group_ids UUID[];
  END IF;

  -- Add assignment_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_link_schedules'
      AND column_name = 'assignment_type'
  ) THEN
    ALTER TABLE attendance_link_schedules 
      ADD COLUMN assignment_type TEXT DEFAULT 'all';
  END IF;
  
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'attendance_link_schedules'
      AND constraint_name = 'attendance_schedules_assignment_type_check'
  ) THEN
    ALTER TABLE attendance_link_schedules
      ADD CONSTRAINT attendance_schedules_assignment_type_check 
      CHECK (assignment_type IN ('all', 'selected', 'groups', 'location_based'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schedules_group_ids ON attendance_link_schedules USING GIN (employee_group_ids);
CREATE INDEX IF NOT EXISTS idx_schedules_assignment_type ON attendance_link_schedules(assignment_type);

-- Function to get employees for a schedule (enhanced with groups)
CREATE OR REPLACE FUNCTION get_schedule_employees_enhanced(p_schedule_id UUID)
RETURNS TABLE(
  employee_id UUID,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  employee_code TEXT,
  job_title TEXT,
  department TEXT,
  group_names TEXT[]
) AS $$
DECLARE
  v_schedule attendance_link_schedules;
  v_employee_ids UUID[];
BEGIN
  SELECT * INTO v_schedule
  FROM attendance_link_schedules
  WHERE id = p_schedule_id;
  
  IF v_schedule.assignment_type = 'all' OR (v_schedule.assignment_type IS NULL AND v_schedule.send_to_all_employees) THEN
    -- All employees
    RETURN QUERY
    SELECT 
      ee.id,
      p.email,
      p.phone,
      p.full_name,
      ee.employee_code,
      ee.job_title,
      ee.department,
      COALESCE(
        ARRAY_AGG(DISTINCT eg.name) FILTER (WHERE eg.name IS NOT NULL),
        ARRAY[]::TEXT[]
      ) as group_names
    FROM employer_employees ee
    JOIN profiles p ON p.id = ee.employee_id
    LEFT JOIN employee_group_assignments ega ON ega.employer_employee_id = ee.id
    LEFT JOIN employee_attendance_groups eg ON eg.id = ega.group_id
    WHERE (
      ee.company_id = v_schedule.company_id
      OR EXISTS (
        SELECT 1 FROM profiles emp_prof
        WHERE emp_prof.id = ee.employer_id
          AND emp_prof.active_company_id = v_schedule.company_id
      )
    )
      AND ee.employment_status = 'active'
    GROUP BY ee.id, p.email, p.phone, p.full_name, ee.employee_code, ee.job_title, ee.department;
      
  ELSIF v_schedule.assignment_type = 'selected' THEN
    -- Specific employees
    RETURN QUERY
    SELECT 
      ee.id,
      p.email,
      p.phone,
      p.full_name,
      ee.employee_code,
      ee.job_title,
      ee.department,
      COALESCE(
        ARRAY_AGG(DISTINCT eg.name) FILTER (WHERE eg.name IS NOT NULL),
        ARRAY[]::TEXT[]
      ) as group_names
    FROM employer_employees ee
    JOIN profiles p ON p.id = ee.employee_id
    LEFT JOIN employee_group_assignments ega ON ega.employer_employee_id = ee.id
    LEFT JOIN employee_attendance_groups eg ON eg.id = ega.group_id
    WHERE (
      ee.company_id = v_schedule.company_id
      OR EXISTS (
        SELECT 1 FROM profiles emp_prof
        WHERE emp_prof.id = ee.employer_id
          AND emp_prof.active_company_id = v_schedule.company_id
      )
    )
      AND ee.employment_status = 'active'
      AND (ee.id = ANY(v_schedule.specific_employee_ids) OR v_schedule.specific_employee_ids IS NULL)
    GROUP BY ee.id, p.email, p.phone, p.full_name, ee.employee_code, ee.job_title, ee.department;
      
  ELSIF v_schedule.assignment_type = 'groups' THEN
    -- Employee groups
    RETURN QUERY
    SELECT 
      ee.id,
      p.email,
      p.phone,
      p.full_name,
      ee.employee_code,
      ee.job_title,
      ee.department,
      ARRAY_AGG(DISTINCT eg.name) FILTER (WHERE eg.name IS NOT NULL) as group_names
    FROM employer_employees ee
    JOIN profiles p ON p.id = ee.employee_id
    JOIN employee_group_assignments ega ON ega.employer_employee_id = ee.id
    JOIN employee_attendance_groups eg ON eg.id = ega.group_id
    WHERE (
      ee.company_id = v_schedule.company_id
      OR EXISTS (
        SELECT 1 FROM profiles emp_prof
        WHERE emp_prof.id = ee.employer_id
          AND emp_prof.active_company_id = v_schedule.company_id
      )
    )
      AND ee.employment_status = 'active'
      AND eg.id = ANY(v_schedule.employee_group_ids)
    GROUP BY ee.id, p.email, p.phone, p.full_name, ee.employee_code, ee.job_title, ee.department;
      
  ELSIF v_schedule.assignment_type = 'location_based' THEN
    -- Location-based (employees in groups associated with the schedule's location)
    RETURN QUERY
    SELECT 
      ee.id,
      p.email,
      p.phone,
      p.full_name,
      ee.employee_code,
      ee.job_title,
      ee.department,
      ARRAY_AGG(DISTINCT eg.name) FILTER (WHERE eg.name IS NOT NULL) as group_names
    FROM employer_employees ee
    JOIN profiles p ON p.id = ee.employee_id
    JOIN employee_group_assignments ega ON ega.employer_employee_id = ee.id
    JOIN employee_attendance_groups eg ON eg.id = ega.group_id
    WHERE (
      ee.company_id = v_schedule.company_id
      OR EXISTS (
        SELECT 1 FROM profiles emp_prof
        WHERE emp_prof.id = ee.employer_id
          AND emp_prof.active_company_id = v_schedule.company_id
      )
    )
      AND ee.employment_status = 'active'
      AND (
        eg.office_location_id = v_schedule.office_location_id
        OR (v_schedule.office_location_id IS NULL AND eg.office_location_id IS NULL)
      )
    GROUP BY ee.id, p.email, p.phone, p.full_name, ee.employee_code, ee.job_title, ee.department;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update employee count in groups
CREATE OR REPLACE FUNCTION update_employee_group_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE employee_attendance_groups
    SET employee_count = (
      SELECT COUNT(*) FROM employee_group_assignments
      WHERE group_id = NEW.group_id
    )
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE employee_attendance_groups
    SET employee_count = (
      SELECT COUNT(*) FROM employee_group_assignments
      WHERE group_id = OLD.group_id
    )
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_group_count_trigger ON employee_group_assignments;
CREATE TRIGGER update_group_count_trigger
  AFTER INSERT OR DELETE ON employee_group_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_group_count();

-- Function to auto-create location-based groups
CREATE OR REPLACE FUNCTION auto_create_location_groups(p_company_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_location RECORD;
  v_group_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Create groups for each office location
  FOR v_location IN
    SELECT DISTINCT ol.id, ol.name, ol.address
    FROM office_locations ol
    WHERE ol.company_id = p_company_id
      AND ol.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM employee_attendance_groups eg
        WHERE eg.office_location_id = ol.id
          AND eg.company_id = p_company_id
      )
  LOOP
    INSERT INTO employee_attendance_groups (
      company_id,
      name,
      description,
      group_type,
      office_location_id
    ) VALUES (
      p_company_id,
      v_location.name || ' Team',
      'Auto-created group for ' || v_location.name || ' (' || v_location.address || ')',
      'location',
      v_location.id
    ) RETURNING id INTO v_group_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE employee_attendance_groups IS 'Employee groups for organizing attendance schedules by location, department, or custom criteria';
COMMENT ON TABLE employee_group_assignments IS 'Links employees to attendance groups';
COMMENT ON COLUMN employee_attendance_groups.group_type IS 'Type of group: location (office location), department, custom, or project';
COMMENT ON COLUMN attendance_link_schedules.assignment_type IS 'How employees are assigned: all, selected (specific employees), groups (employee groups), or location_based (auto by location)';

