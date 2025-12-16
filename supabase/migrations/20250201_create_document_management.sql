-- Document Management System
-- Creates comprehensive document tracking with expiry alerts and compliance monitoring

-- 1. Employee Documents Table
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'id_card', 
    'passport', 
    'contract', 
    'certificate', 
    'training_certificate',
    'license',
    'visa',
    'work_permit',
    'insurance',
    'other'
  )),
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  expiry_date DATE,
  issue_date DATE,
  issuing_authority TEXT,
  document_number TEXT, -- e.g., passport number, license number
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'rejected', 'renewed')),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one document type per employee (unless expired/rejected)
  CONSTRAINT employee_documents_unique_active UNIQUE (employer_employee_id, document_type, status)
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employer_employee_id ON employee_documents(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_document_type ON employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON employee_documents(status);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiry_date ON employee_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiring ON employee_documents(expiry_date) 
  WHERE expiry_date IS NOT NULL AND status = 'verified';

-- 2. Document Reminders Table
CREATE TABLE IF NOT EXISTS document_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES employee_documents(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'expiry_warning_30',
    'expiry_warning_15',
    'expiry_warning_7',
    'renewal_due',
    'missing_document'
  )),
  reminder_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  sent_to UUID REFERENCES profiles(id), -- Who received the reminder
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'dismissed')),
  notification_method TEXT DEFAULT 'email' CHECK (notification_method IN ('email', 'sms', 'in_app', 'all')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT document_reminders_unique UNIQUE (document_id, reminder_type, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_document_reminders_document_id ON document_reminders(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reminders_status ON document_reminders(status);
CREATE INDEX IF NOT EXISTS idx_document_reminders_reminder_date ON document_reminders(reminder_date);

-- 3. Compliance Requirements Table (for tracking what documents are required)
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  requirement_name TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'document',
    'training',
    'policy',
    'certification',
    'license'
  )),
  document_type TEXT, -- References document_type if requirement_type = 'document'
  is_mandatory BOOLEAN DEFAULT true,
  expiry_days INTEGER, -- Days before expiry to start alerting (e.g., 30, 15, 7)
  applicable_to TEXT[] DEFAULT ARRAY['all'], -- ['all', 'specific_roles', 'specific_departments']
  applicable_roles TEXT[], -- If applicable_to includes 'specific_roles'
  applicable_departments TEXT[], -- If applicable_to includes 'specific_departments'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_requirements_company_id ON compliance_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_type ON compliance_requirements(requirement_type);

-- 4. Employee Compliance Status Table
CREATE TABLE IF NOT EXISTS employee_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'compliant', 'non_compliant', 'expired', 'waived')),
  completion_date DATE,
  expiry_date DATE,
  last_checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT employee_compliance_unique UNIQUE (employer_employee_id, requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_compliance_employer_employee_id ON employee_compliance(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_compliance_requirement_id ON employee_compliance(requirement_id);
CREATE INDEX IF NOT EXISTS idx_employee_compliance_status ON employee_compliance(status);
CREATE INDEX IF NOT EXISTS idx_employee_compliance_expiry_date ON employee_compliance(expiry_date);

-- Enable Row Level Security
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_documents
CREATE POLICY "Employers can view their employees' documents"
  ON employee_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_documents.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employers can manage their employees' documents"
  ON employee_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_documents.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view their own documents"
  ON employee_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_documents.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- RLS Policies for document_reminders
CREATE POLICY "Users can view reminders for their accessible documents"
  ON document_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employee_documents ed
      JOIN employer_employees ee ON ee.id = ed.employer_employee_id
      WHERE ed.id = document_reminders.document_id
      AND (
        ee.employer_id = auth.uid() OR
        ee.employee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      )
    )
  );

-- RLS Policies for compliance_requirements
CREATE POLICY "Users can view compliance requirements for their company"
  ON compliance_requirements FOR SELECT
  USING (
    company_id IN (
      SELECT active_company_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins and company owners can manage compliance requirements"
  ON compliance_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN companies c ON c.id = compliance_requirements.company_id
      WHERE p.id = auth.uid()
      AND (
        p.role = 'admin' OR
        (p.active_company_id = c.id AND c.owner_id = p.id)
      )
    )
  );

-- RLS Policies for employee_compliance
CREATE POLICY "Users can view compliance status for accessible employees"
  ON employee_compliance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_compliance.employer_employee_id
      AND (
        ee.employer_id = auth.uid() OR
        ee.employee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_compliance_requirements_updated_at
  BEFORE UPDATE ON compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_employee_compliance_updated_at
  BEFORE UPDATE ON employee_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

-- Function to automatically update document status based on expiry date
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If expiry_date is set and in the past, mark as expired
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
    IF NEW.status = 'verified' THEN
      NEW.status = 'expired';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_document_expiry_trigger
  BEFORE INSERT OR UPDATE ON employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION check_document_expiry();

-- Comments for documentation
COMMENT ON TABLE employee_documents IS 'Stores all employee documents with expiry tracking';
COMMENT ON TABLE document_reminders IS 'Tracks document expiry reminders and notifications';
COMMENT ON TABLE compliance_requirements IS 'Defines compliance requirements per company';
COMMENT ON TABLE employee_compliance IS 'Tracks employee compliance status for each requirement';

