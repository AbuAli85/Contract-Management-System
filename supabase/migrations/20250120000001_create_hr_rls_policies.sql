-- HR Module Row Level Security Policies
-- Implements comprehensive access control for HR data

-- Ensure HR schema exists (in case this migration runs before schema creation)
CREATE SCHEMA IF NOT EXISTS hr;

-- Create tables if they don't exist (in case this migration runs before schema creation)
CREATE TABLE IF NOT EXISTS hr.departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.employees (
  id BIGSERIAL PRIMARY KEY,
  employee_code TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  nationality TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  job_title TEXT,
  department_id BIGINT REFERENCES hr.departments(id),
  manager_employee_id BIGINT REFERENCES hr.employees(id),
  phone TEXT,
  email TEXT,
  personal_email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'probation', 'on_leave', 'terminated')),
  hire_date DATE,
  termination_date DATE,
  salary DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  work_location TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.passports (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  passport_number TEXT NOT NULL,
  issuing_country TEXT,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  place_of_issue TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.visas (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  visa_number TEXT,
  visa_type TEXT,
  sponsor TEXT,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  issuing_authority TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.employee_documents (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('PASSPORT', 'VISA', 'NAT_ID', 'CONTRACT', 'LETTER', 'CERTIFICATE', 'OTHER')),
  storage_path TEXT NOT NULL,
  title TEXT,
  description TEXT,
  issued_on DATE,
  valid_until DATE,
  file_size BIGINT,
  mime_type TEXT,
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.attendance_logs (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  location TEXT,
  method TEXT DEFAULT 'web',
  notes TEXT,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  break_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.leave_requests (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by BIGINT REFERENCES hr.employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.doc_templates (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  category TEXT NOT NULL CHECK (category IN ('LETTER', 'CONTRACT', 'CERTIFICATE', 'FORM')),
  engine TEXT DEFAULT 'handlebars',
  storage_path TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.generated_docs (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  template_id BIGINT REFERENCES hr.doc_templates(id),
  output_storage_path TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  generation_data JSONB,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: hr_user_role enum type is created in the schema migration

CREATE TABLE IF NOT EXISTS hr.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id BIGINT REFERENCES hr.employees(id),
  role hr_user_role NOT NULL DEFAULT 'employee',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.notifications (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('document_expiry', 'leave_approval', 'attendance_alert', 'contract_renewal', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Enable RLS on all HR tables
ALTER TABLE hr.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.doc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.generated_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.departments ENABLE ROW LEVEL SECURITY;

-- Helper functions for role checking
CREATE OR REPLACE FUNCTION hr.is_hr_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = uid AND up.role = 'hr_admin'
  )
$$;

CREATE OR REPLACE FUNCTION hr.is_hr_staff(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = uid AND up.role IN ('hr_admin', 'hr_staff')
  )
$$;

CREATE OR REPLACE FUNCTION hr.is_manager(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = uid AND up.role = 'manager'
  )
$$;

CREATE OR REPLACE FUNCTION hr.is_employee(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = uid AND up.role = 'employee'
  )
$$;

-- Helper: Check if user is manager of specific employee
CREATE OR REPLACE FUNCTION hr.is_manager_of(uid UUID, emp_id BIGINT)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM hr.user_profiles up
    JOIN hr.employees m ON m.id = up.employee_id
    WHERE up.user_id = uid
      AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM hr.employees e
        WHERE e.id = emp_id AND e.manager_employee_id = m.id
      )
  )
$$;

-- Helper: Get employee ID for user
CREATE OR REPLACE FUNCTION hr.get_employee_id(uid UUID)
RETURNS BIGINT LANGUAGE SQL STABLE AS $$
  SELECT up.employee_id FROM hr.user_profiles up WHERE up.user_id = uid
$$;

-- ==============================================
-- DROP EXISTING POLICIES (for idempotent migrations)
-- ==============================================

-- Drop all HR policies if they exist
DROP POLICY IF EXISTS hr_departments_hr_all ON hr.departments;
DROP POLICY IF EXISTS hr_departments_read_all ON hr.departments;
DROP POLICY IF EXISTS hr_employees_hr_all ON hr.employees;
DROP POLICY IF EXISTS hr_employees_self_read ON hr.employees;
DROP POLICY IF EXISTS hr_employees_manager_read ON hr.employees;
DROP POLICY IF EXISTS hr_passports_hr_all ON hr.passports;
DROP POLICY IF EXISTS hr_passports_self_read ON hr.passports;
DROP POLICY IF EXISTS hr_passports_manager_read ON hr.passports;
DROP POLICY IF EXISTS hr_visas_hr_all ON hr.visas;
DROP POLICY IF EXISTS hr_visas_self_read ON hr.visas;
DROP POLICY IF EXISTS hr_visas_manager_read ON hr.visas;
DROP POLICY IF EXISTS hr_documents_hr_all ON hr.employee_documents;
DROP POLICY IF EXISTS hr_documents_self_read ON hr.employee_documents;
DROP POLICY IF EXISTS hr_documents_manager_read ON hr.employee_documents;
DROP POLICY IF EXISTS hr_attendance_hr_all ON hr.attendance_logs;
DROP POLICY IF EXISTS hr_attendance_self_read ON hr.attendance_logs;
DROP POLICY IF EXISTS hr_attendance_self_insert ON hr.attendance_logs;
DROP POLICY IF EXISTS hr_attendance_manager_read ON hr.attendance_logs;
DROP POLICY IF EXISTS hr_leave_hr_all ON hr.leave_requests;
DROP POLICY IF EXISTS hr_leave_self_read ON hr.leave_requests;
DROP POLICY IF EXISTS hr_leave_self_insert ON hr.leave_requests;
DROP POLICY IF EXISTS hr_leave_self_update ON hr.leave_requests;
DROP POLICY IF EXISTS hr_leave_manager_read ON hr.leave_requests;
DROP POLICY IF EXISTS hr_leave_manager_approve ON hr.leave_requests;
DROP POLICY IF EXISTS hr_templates_hr_all ON hr.doc_templates;
DROP POLICY IF EXISTS hr_templates_read_active ON hr.doc_templates;
DROP POLICY IF EXISTS hr_generated_docs_hr_all ON hr.generated_docs;
DROP POLICY IF EXISTS hr_generated_docs_self_read ON hr.generated_docs;
DROP POLICY IF EXISTS hr_generated_docs_manager_read ON hr.generated_docs;
DROP POLICY IF EXISTS hr_user_profiles_hr_all ON hr.user_profiles;
DROP POLICY IF EXISTS hr_user_profiles_self_read ON hr.user_profiles;
DROP POLICY IF EXISTS hr_notifications_hr_all ON hr.notifications;
DROP POLICY IF EXISTS hr_notifications_self_read ON hr.notifications;
DROP POLICY IF EXISTS hr_notifications_self_update ON hr.notifications;

-- ==============================================
-- DEPARTMENTS POLICIES
-- ==============================================

-- HR staff can manage departments
CREATE POLICY hr_departments_hr_all ON hr.departments
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- All authenticated users can read departments
CREATE POLICY hr_departments_read_all ON hr.departments
FOR SELECT USING (auth.uid() IS NOT NULL);

-- ==============================================
-- EMPLOYEES POLICIES
-- ==============================================

-- HR staff can do everything with employees
CREATE POLICY hr_employees_hr_all ON hr.employees
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read their own record
CREATE POLICY hr_employees_self_read ON hr.employees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.employees.id
  )
);

-- Managers can read their team members
CREATE POLICY hr_employees_manager_read ON hr.employees
FOR SELECT USING (hr.is_manager_of(auth.uid(), hr.employees.id));

-- ==============================================
-- PASSPORTS POLICIES
-- ==============================================

-- HR staff can manage all passports
CREATE POLICY hr_passports_hr_all ON hr.passports
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read their own passports
CREATE POLICY hr_passports_self_read ON hr.passports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.passports.employee_id
  )
);

-- Managers can read their team's passports
CREATE POLICY hr_passports_manager_read ON hr.passports
FOR SELECT USING (hr.is_manager_of(auth.uid(), hr.passports.employee_id));

-- ==============================================
-- VISAS POLICIES
-- ==============================================

-- HR staff can manage all visas
CREATE POLICY hr_visas_hr_all ON hr.visas
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read their own visas
CREATE POLICY hr_visas_self_read ON hr.visas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.visas.employee_id
  )
);

-- Managers can read their team's visas
CREATE POLICY hr_visas_manager_read ON hr.visas
FOR SELECT USING (hr.is_manager_of(auth.uid(), hr.visas.employee_id));

-- ==============================================
-- EMPLOYEE DOCUMENTS POLICIES
-- ==============================================

-- HR staff can manage all documents
CREATE POLICY hr_documents_hr_all ON hr.employee_documents
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read their own non-confidential documents
CREATE POLICY hr_documents_self_read ON hr.employee_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.employee_id = hr.employee_documents.employee_id
    AND hr.employee_documents.is_confidential = false
  )
);

-- Managers can read their team's non-confidential documents
CREATE POLICY hr_documents_manager_read ON hr.employee_documents
FOR SELECT USING (
  hr.is_manager_of(auth.uid(), hr.employee_documents.employee_id)
  AND hr.employee_documents.is_confidential = false
);

-- ==============================================
-- ATTENDANCE LOGS POLICIES
-- ==============================================

-- HR staff can manage all attendance
CREATE POLICY hr_attendance_hr_all ON hr.attendance_logs
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read and insert their own attendance
CREATE POLICY hr_attendance_self_read ON hr.attendance_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.attendance_logs.employee_id
  )
);

CREATE POLICY hr_attendance_self_insert ON hr.attendance_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.attendance_logs.employee_id
  )
);

-- Managers can read their team's attendance
CREATE POLICY hr_attendance_manager_read ON hr.attendance_logs
FOR SELECT USING (hr.is_manager_of(auth.uid(), hr.attendance_logs.employee_id));

-- ==============================================
-- LEAVE REQUESTS POLICIES
-- ==============================================

-- HR staff can manage all leave requests
CREATE POLICY hr_leave_hr_all ON hr.leave_requests
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read and insert their own leave requests
CREATE POLICY hr_leave_self_read ON hr.leave_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.leave_requests.employee_id
  )
);

CREATE POLICY hr_leave_self_insert ON hr.leave_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.leave_requests.employee_id
  )
);

-- Employees can update their own pending leave requests
CREATE POLICY hr_leave_self_update ON hr.leave_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.employee_id = hr.leave_requests.employee_id
    AND hr.leave_requests.approval_status = 'pending'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.employee_id = hr.leave_requests.employee_id
    AND hr.leave_requests.approval_status = 'pending'
  )
);

-- Managers can read and approve their team's leave requests
CREATE POLICY hr_leave_manager_read ON hr.leave_requests
FOR SELECT USING (hr.is_manager_of(auth.uid(), hr.leave_requests.employee_id));

CREATE POLICY hr_leave_manager_approve ON hr.leave_requests
FOR UPDATE USING (hr.is_manager_of(auth.uid(), hr.leave_requests.employee_id))
WITH CHECK (hr.is_manager_of(auth.uid(), hr.leave_requests.employee_id));

-- ==============================================
-- DOCUMENT TEMPLATES POLICIES
-- ==============================================

-- HR staff can manage templates
CREATE POLICY hr_templates_hr_all ON hr.doc_templates
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- All authenticated users can read active templates
CREATE POLICY hr_templates_read_active ON hr.doc_templates
FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- ==============================================
-- GENERATED DOCUMENTS POLICIES
-- ==============================================

-- HR staff can manage all generated documents
CREATE POLICY hr_generated_docs_hr_all ON hr.generated_docs
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read their own generated documents
CREATE POLICY hr_generated_docs_self_read ON hr.generated_docs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.generated_docs.employee_id
  )
);

-- Managers can read their team's generated documents
CREATE POLICY hr_generated_docs_manager_read ON hr.generated_docs
FOR SELECT USING (hr.is_manager_of(auth.uid(), hr.generated_docs.employee_id));

-- ==============================================
-- USER PROFILES POLICIES
-- ==============================================

-- HR staff can manage all user profiles
CREATE POLICY hr_user_profiles_hr_all ON hr.user_profiles
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Users can read their own profile
CREATE POLICY hr_user_profiles_self_read ON hr.user_profiles
FOR SELECT USING (user_id = auth.uid());

-- ==============================================
-- NOTIFICATIONS POLICIES
-- ==============================================

-- HR staff can manage all notifications
CREATE POLICY hr_notifications_hr_all ON hr.notifications
FOR ALL USING (hr.is_hr_staff(auth.uid())) 
WITH CHECK (hr.is_hr_staff(auth.uid()));

-- Employees can read and update their own notifications
CREATE POLICY hr_notifications_self_read ON hr.notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.notifications.employee_id
  )
);

CREATE POLICY hr_notifications_self_update ON hr.notifications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.notifications.employee_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM hr.user_profiles up
    WHERE up.user_id = auth.uid() AND up.employee_id = hr.notifications.employee_id
  )
);

-- ==============================================
-- VIEWS POLICIES
-- ==============================================

-- Note: Views are created in a separate migration (20250120000002_create_hr_views.sql)
-- Grant access to views for authenticated users
GRANT SELECT ON hr.expiring_documents_60d TO authenticated;
GRANT SELECT ON hr.attendance_monthly TO authenticated;
GRANT SELECT ON hr.employee_summary TO authenticated;

-- ==============================================
-- STORAGE POLICIES (to be created via Supabase Dashboard or API)
-- ==============================================

-- Note: Storage policies need to be created via Supabase Dashboard or API
-- Here's the conceptual structure:

-- Bucket: employee-docs
-- Policy: HR staff can read/write all files
-- Policy: Employees can read their own files (employee-docs/{employee_id}/**)
-- Policy: Managers can read their team's files

-- Bucket: hr-templates  
-- Policy: HR staff can read/write all files
-- Policy: All authenticated users can read files
