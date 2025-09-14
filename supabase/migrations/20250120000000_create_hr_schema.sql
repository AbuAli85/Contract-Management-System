-- HR Module Schema Migration
-- Creates comprehensive HR management system with employee records, documents, attendance, and document generation

-- Create HR schema
CREATE SCHEMA IF NOT EXISTS hr;

-- 1. Core reference tables
CREATE TABLE IF NOT EXISTS hr.departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Employee master table
CREATE TABLE IF NOT EXISTS hr.employees (
  id BIGSERIAL PRIMARY KEY,
  employee_code TEXT UNIQUE, -- internal code
  user_id UUID REFERENCES auth.users(id), -- optional link to login user
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

-- Indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON hr.employees (department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON hr.employees (manager_employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON hr.employees (employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON hr.employees (hire_date);

-- 3. Identity & immigration documents
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

CREATE INDEX IF NOT EXISTS idx_passports_employee_id ON hr.passports (employee_id);
CREATE INDEX IF NOT EXISTS idx_passports_expiry_date ON hr.passports (expiry_date);

CREATE TABLE IF NOT EXISTS hr.visas (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  visa_number TEXT,
  visa_type TEXT, -- e.g., work, business, tourist
  sponsor TEXT,   -- employer/sponsor name if used
  issue_date DATE,
  expiry_date DATE NOT NULL,
  issuing_authority TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visas_employee_id ON hr.visas (employee_id);
CREATE INDEX IF NOT EXISTS idx_visas_expiry_date ON hr.visas (expiry_date);

-- 4. Employee documents (passport scans, IDs, contracts, letters...)
CREATE TABLE IF NOT EXISTS hr.employee_documents (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('PASSPORT', 'VISA', 'NAT_ID', 'CONTRACT', 'LETTER', 'CERTIFICATE', 'OTHER')),
  storage_path TEXT NOT NULL, -- Supabase storage path
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

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON hr.employee_documents (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON hr.employee_documents (doc_type);
CREATE INDEX IF NOT EXISTS idx_employee_documents_valid_until ON hr.employee_documents (valid_until);

-- 5. Attendance & time tracking
CREATE TABLE IF NOT EXISTS hr.attendance_logs (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  location TEXT,     -- optional: office/site
  method TEXT DEFAULT 'web',       -- web|mobile|device
  notes TEXT,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  break_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_id ON hr.attendance_logs (employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_check_in ON hr.attendance_logs (check_in);
-- Note: Date-based index removed due to immutability constraints
-- Consider using a materialized view or application-level date filtering

-- 6. Leave management
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

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON hr.leave_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON hr.leave_requests (approval_status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON hr.leave_requests (start_date, end_date);

-- 7. Document templates for contracts and letters
CREATE TABLE IF NOT EXISTS hr.doc_templates (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,        -- e.g., 'offer_letter_ar', 'employment_contract_en'
  display_name TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  category TEXT NOT NULL CHECK (category IN ('LETTER', 'CONTRACT', 'CERTIFICATE', 'FORM')),
  engine TEXT DEFAULT 'handlebars',-- templating engine identifier
  storage_path TEXT NOT NULL,      -- .hbs/.html template stored in Supabase storage
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_templates_key ON hr.doc_templates (key);
CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON hr.doc_templates (category);
CREATE INDEX IF NOT EXISTS idx_doc_templates_language ON hr.doc_templates (language);

-- 8. Generated documents tracking
CREATE TABLE IF NOT EXISTS hr.generated_docs (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hr.employees(id) ON DELETE CASCADE,
  template_id BIGINT REFERENCES hr.doc_templates(id),
  output_storage_path TEXT NOT NULL, -- final PDF path
  generated_by UUID REFERENCES auth.users(id),
  generation_data JSONB, -- store the data used for generation
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_docs_employee_id ON hr.generated_docs (employee_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_template_id ON hr.generated_docs (template_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_status ON hr.generated_docs (status);

-- 9. User roles mapping for HR module
DO $$ BEGIN
    CREATE TYPE hr_user_role AS ENUM ('hr_admin', 'hr_staff', 'manager', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS hr.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id BIGINT REFERENCES hr.employees(id),
  role hr_user_role NOT NULL DEFAULT 'employee',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON hr.user_profiles (employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON hr.user_profiles (role);

-- 10. HR notifications and alerts
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

CREATE INDEX IF NOT EXISTS idx_notifications_employee_id ON hr.notifications (employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON hr.notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON hr.notifications (is_read);

-- 11. Views will be created in a separate migration after all tables are established

-- 12. Insert default departments
INSERT INTO hr.departments (name, description) VALUES
('Human Resources', 'Human Resources Department'),
('Information Technology', 'IT Department'),
('Finance', 'Finance and Accounting Department'),
('Operations', 'Operations Department'),
('Sales', 'Sales and Marketing Department'),
('Customer Service', 'Customer Service Department')
ON CONFLICT (name) DO NOTHING;

-- 13. Insert default document templates
INSERT INTO hr.doc_templates (key, display_name, language, category, storage_path, description) VALUES
('employment_contract_en', 'Employment Contract (English)', 'en', 'CONTRACT', 'hr-templates/employment_contract_en.hbs', 'Standard employment contract template in English'),
('employment_contract_ar', 'Employment Contract (Arabic)', 'ar', 'CONTRACT', 'hr-templates/employment_contract_ar.hbs', 'Standard employment contract template in Arabic'),
('offer_letter_en', 'Job Offer Letter (English)', 'en', 'LETTER', 'hr-templates/offer_letter_en.hbs', 'Job offer letter template in English'),
('offer_letter_ar', 'Job Offer Letter (Arabic)', 'ar', 'LETTER', 'hr-templates/offer_letter_ar.hbs', 'Job offer letter template in Arabic'),
('termination_letter_en', 'Termination Letter (English)', 'en', 'LETTER', 'hr-templates/termination_letter_en.hbs', 'Employee termination letter template in English'),
('termination_letter_ar', 'Termination Letter (Arabic)', 'ar', 'LETTER', 'hr-templates/termination_letter_ar.hbs', 'Employee termination letter template in Arabic'),
('employment_verification_en', 'Employment Verification (English)', 'en', 'LETTER', 'hr-templates/employment_verification_en.hbs', 'Employment verification letter template in English'),
('employment_verification_ar', 'Employment Verification (Arabic)', 'ar', 'LETTER', 'hr-templates/employment_verification_ar.hbs', 'Employment verification letter template in Arabic')
ON CONFLICT (key) DO NOTHING;

-- 14. Add updated_at triggers
CREATE OR REPLACE FUNCTION hr.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON hr.employees FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
CREATE TRIGGER update_passports_updated_at BEFORE UPDATE ON hr.passports FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
CREATE TRIGGER update_visas_updated_at BEFORE UPDATE ON hr.visas FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON hr.employee_documents FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
CREATE TRIGGER update_attendance_logs_updated_at BEFORE UPDATE ON hr.attendance_logs FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON hr.leave_requests FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
CREATE TRIGGER update_doc_templates_updated_at BEFORE UPDATE ON hr.doc_templates FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON hr.user_profiles FOR EACH ROW EXECUTE FUNCTION hr.update_updated_at_column();
