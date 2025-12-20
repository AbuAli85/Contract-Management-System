-- Work Permit Management System
-- Based on Ministry of Labour (Oman) Workflow
-- Creates comprehensive work permit tracking, applications, and renewals

-- 1. Work Permit Applications Table
CREATE TABLE IF NOT EXISTS work_permit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employer_party_id UUID REFERENCES parties(id) ON DELETE SET NULL, -- Company/Employer party
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  promoter_id UUID REFERENCES promoters(id) ON DELETE SET NULL, -- If linked to promoter
  
  -- Application Details
  application_number TEXT UNIQUE, -- Auto-generated: WP-YYYY-XXXXX
  application_type TEXT NOT NULL CHECK (application_type IN (
    'new', 'renewal', 'transfer', 'cancellation', 'amendment'
  )),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'
  )),
  
  -- Employee Information
  employee_name_en TEXT NOT NULL,
  employee_name_ar TEXT,
  national_id TEXT, -- Omani National ID or Passport
  passport_number TEXT,
  nationality TEXT,
  job_title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT CHECK (employment_type IN (
    'full_time', 'part_time', 'contract', 'temporary'
  )),
  
  -- Work Permit Details
  work_permit_number TEXT, -- Issued by Ministry
  work_permit_start_date DATE,
  work_permit_end_date DATE,
  work_permit_category TEXT, -- Professional, Technical, etc.
  salary DECIMAL(12,2),
  currency TEXT DEFAULT 'OMR',
  
  -- Ministry Integration
  ministry_reference_number TEXT, -- Reference from Ministry system
  ministry_submission_date TIMESTAMPTZ,
  ministry_approval_date TIMESTAMPTZ,
  ministry_rejection_reason TEXT,
  
  -- Documents
  required_documents JSONB DEFAULT '[]'::jsonb, -- List of required documents
  submitted_documents JSONB DEFAULT '[]'::jsonb, -- Documents submitted
  document_urls JSONB DEFAULT '{}'::jsonb, -- Links to uploaded documents
  
  -- Workflow
  submitted_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Notes & Comments
  internal_notes TEXT,
  ministry_notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes for work_permit_applications
CREATE INDEX IF NOT EXISTS idx_work_permit_applications_employer_id 
  ON work_permit_applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_work_permit_applications_employee_id 
  ON work_permit_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_permit_applications_promoter_id 
  ON work_permit_applications(promoter_id) WHERE promoter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_permit_applications_status 
  ON work_permit_applications(status);
CREATE INDEX IF NOT EXISTS idx_work_permit_applications_application_type 
  ON work_permit_applications(application_type);
CREATE INDEX IF NOT EXISTS idx_work_permit_applications_work_permit_number 
  ON work_permit_applications(work_permit_number) 
  WHERE work_permit_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_permit_applications_expiry_date 
  ON work_permit_applications(work_permit_end_date) 
  WHERE work_permit_end_date IS NOT NULL;

-- 2. Work Permit Renewals Table
CREATE TABLE IF NOT EXISTS work_permit_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_permit_application_id UUID REFERENCES work_permit_applications(id) ON DELETE SET NULL,
  original_work_permit_number TEXT NOT NULL,
  
  -- Renewal Details
  renewal_number TEXT UNIQUE, -- Auto-generated: REN-YYYY-XXXXX
  renewal_type TEXT DEFAULT 'standard' CHECK (renewal_type IN (
    'standard', 'early', 'extension', 'emergency'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'submitted', 'approved', 'rejected', 'expired'
  )),
  
  -- Dates
  current_expiry_date DATE NOT NULL,
  renewal_start_date DATE,
  renewal_end_date DATE,
  renewal_submitted_date TIMESTAMPTZ,
  renewal_approved_date TIMESTAMPTZ,
  
  -- Reminders
  reminder_sent_90_days BOOLEAN DEFAULT FALSE,
  reminder_sent_60_days BOOLEAN DEFAULT FALSE,
  reminder_sent_30_days BOOLEAN DEFAULT FALSE,
  reminder_sent_14_days BOOLEAN DEFAULT FALSE,
  reminder_sent_7_days BOOLEAN DEFAULT FALSE,
  
  -- Documents
  renewal_documents JSONB DEFAULT '[]'::jsonb,
  document_urls JSONB DEFAULT '{}'::jsonb,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes for work_permit_renewals
CREATE INDEX IF NOT EXISTS idx_work_permit_renewals_application_id 
  ON work_permit_renewals(work_permit_application_id);
CREATE INDEX IF NOT EXISTS idx_work_permit_renewals_status 
  ON work_permit_renewals(status);
CREATE INDEX IF NOT EXISTS idx_work_permit_renewals_expiry_date 
  ON work_permit_renewals(current_expiry_date);
CREATE INDEX IF NOT EXISTS idx_work_permit_renewals_original_number 
  ON work_permit_renewals(original_work_permit_number);

-- 3. Work Permit Compliance Tracking Table
CREATE TABLE IF NOT EXISTS work_permit_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employer_party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_permit_application_id UUID REFERENCES work_permit_applications(id) ON DELETE SET NULL,
  
  -- Compliance Status
  compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN (
    'compliant', 'expiring_soon', 'expired', 'non_compliant', 'pending_renewal'
  )),
  
  -- Current Work Permit
  work_permit_number TEXT,
  work_permit_expiry_date DATE,
  days_until_expiry INTEGER,
  
  -- Alerts
  last_alert_sent TIMESTAMPTZ,
  alert_level TEXT CHECK (alert_level IN ('info', 'warning', 'urgent', 'critical')),
  
  -- Compliance History
  compliance_history JSONB DEFAULT '[]'::jsonb, -- Track compliance changes
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one compliance record per employee
  CONSTRAINT work_permit_compliance_unique UNIQUE (employer_id, employee_id)
);

-- Indexes for work_permit_compliance
CREATE INDEX IF NOT EXISTS idx_work_permit_compliance_employer_id 
  ON work_permit_compliance(employer_id);
CREATE INDEX IF NOT EXISTS idx_work_permit_compliance_employee_id 
  ON work_permit_compliance(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_permit_compliance_status 
  ON work_permit_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_work_permit_compliance_expiry_date 
  ON work_permit_compliance(work_permit_expiry_date);
CREATE INDEX IF NOT EXISTS idx_work_permit_compliance_alert_level 
  ON work_permit_compliance(alert_level) 
  WHERE alert_level IS NOT NULL;

-- 4. Function to generate application number
CREATE OR REPLACE FUNCTION generate_work_permit_application_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  app_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 8) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM work_permit_applications
  WHERE application_number LIKE 'WP-' || year_part || '-%';
  
  app_number := 'WP-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN app_number;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to generate renewal number
CREATE OR REPLACE FUNCTION generate_work_permit_renewal_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  renewal_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(renewal_number FROM 5) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM work_permit_renewals
  WHERE renewal_number LIKE 'REN-' || year_part || '-%';
  
  renewal_number := 'REN-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN renewal_number;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-generate application number
CREATE OR REPLACE FUNCTION set_work_permit_application_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    NEW.application_number := generate_work_permit_application_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_work_permit_application_number
  BEFORE INSERT ON work_permit_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_work_permit_application_number();

-- 7. Trigger to auto-generate renewal number
CREATE OR REPLACE FUNCTION set_work_permit_renewal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.renewal_number IS NULL OR NEW.renewal_number = '' THEN
    NEW.renewal_number := generate_work_permit_renewal_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_work_permit_renewal_number
  BEFORE INSERT ON work_permit_renewals
  FOR EACH ROW
  EXECUTE FUNCTION set_work_permit_renewal_number();

-- 8. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_work_permit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_permit_applications_updated_at
  BEFORE UPDATE ON work_permit_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_work_permit_updated_at();

CREATE TRIGGER trigger_update_work_permit_renewals_updated_at
  BEFORE UPDATE ON work_permit_renewals
  FOR EACH ROW
  EXECUTE FUNCTION update_work_permit_updated_at();

CREATE TRIGGER trigger_update_work_permit_compliance_updated_at
  BEFORE UPDATE ON work_permit_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_work_permit_updated_at();

-- 9. Function to calculate compliance status
CREATE OR REPLACE FUNCTION calculate_work_permit_compliance()
RETURNS TRIGGER AS $$
DECLARE
  days_until_expiry INTEGER;
  new_status TEXT;
  new_alert_level TEXT;
BEGIN
  -- Calculate days until expiry
  IF NEW.work_permit_expiry_date IS NOT NULL THEN
    days_until_expiry := NEW.work_permit_expiry_date - CURRENT_DATE;
    NEW.days_until_expiry := days_until_expiry;
    
    -- Determine compliance status and alert level
    IF days_until_expiry < 0 THEN
      new_status := 'expired';
      new_alert_level := 'critical';
    ELSIF days_until_expiry <= 7 THEN
      new_status := 'expiring_soon';
      new_alert_level := 'urgent';
    ELSIF days_until_expiry <= 30 THEN
      new_status := 'expiring_soon';
      new_alert_level := 'warning';
    ELSIF days_until_expiry <= 60 THEN
      new_status := 'expiring_soon';
      new_alert_level := 'info';
    ELSE
      new_status := 'compliant';
      new_alert_level := NULL;
    END IF;
    
    NEW.compliance_status := new_status;
    NEW.alert_level := new_alert_level;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_work_permit_compliance
  BEFORE INSERT OR UPDATE ON work_permit_compliance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_work_permit_compliance();

-- 10. Comments for documentation
COMMENT ON TABLE work_permit_applications IS 'Work permit applications based on Ministry of Labour (Oman) workflow';
COMMENT ON TABLE work_permit_renewals IS 'Work permit renewal tracking and management';
COMMENT ON TABLE work_permit_compliance IS 'Work permit compliance status and expiry tracking';

COMMENT ON COLUMN work_permit_applications.application_number IS 'Auto-generated format: WP-YYYY-XXXXX';
COMMENT ON COLUMN work_permit_applications.ministry_reference_number IS 'Reference number from Ministry of Labour system';
COMMENT ON COLUMN work_permit_renewals.renewal_number IS 'Auto-generated format: REN-YYYY-XXXXX';

