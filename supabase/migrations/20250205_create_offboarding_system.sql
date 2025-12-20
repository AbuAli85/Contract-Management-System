-- Employee Offboarding System
-- Complete system for exit interviews, document return, and final settlements

-- 1. Exit Interviews Table
CREATE TABLE IF NOT EXISTS exit_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Interview Details
  interview_date DATE NOT NULL,
  conducted_by UUID REFERENCES profiles(id), -- HR or manager
  interview_type TEXT DEFAULT 'in_person' CHECK (interview_type IN (
    'in_person', 'phone', 'video', 'written'
  )),
  
  -- Questions & Answers
  questions_answers JSONB DEFAULT '[]'::jsonb, -- Array of {question, answer}
  
  -- Reasons
  resignation_reason TEXT,
  reason_category TEXT CHECK (reason_category IN (
    'better_opportunity', 'salary', 'work_environment', 'management',
    'career_growth', 'personal', 'relocation', 'other'
  )),
  
  -- Feedback
  overall_feedback TEXT,
  suggestions_for_improvement TEXT,
  would_recommend BOOLEAN,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'completed', 'cancelled', 'no_show'
  )),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_exit_interviews_employee_id ON exit_interviews(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_company_id ON exit_interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_status ON exit_interviews(status);

-- 2. Document Return Tracking Table
CREATE TABLE IF NOT EXISTS document_return_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Documents to Return
  documents_to_return JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {document_type, document_name, returned, returned_date}
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'partial', 'completed', 'waived'
  )),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Dates
  requested_date DATE NOT NULL,
  deadline_date DATE,
  completed_date DATE,
  
  -- Tracking
  returned_by UUID REFERENCES profiles(id),
  received_by UUID REFERENCES profiles(id),
  received_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_document_return_tracking_employee_id ON document_return_tracking(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_document_return_tracking_status ON document_return_tracking(status);

-- 3. Final Settlements Table
CREATE TABLE IF NOT EXISTS final_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Settlement Details
  settlement_type TEXT NOT NULL CHECK (settlement_type IN (
    'resignation', 'termination', 'end_of_contract', 'retirement'
  )),
  last_working_date DATE NOT NULL,
  settlement_date DATE NOT NULL,
  
  -- Financial Calculations
  final_salary DECIMAL(12,2),
  unused_leave_days INTEGER,
  leave_encashment DECIMAL(12,2),
  notice_period_pay DECIMAL(12,2),
  gratuity DECIMAL(12,2), -- If applicable
  deductions DECIMAL(12,2),
  total_settlement DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'OMR',
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'processed', 'paid', 'cancelled'
  )),
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id),
  
  -- Documents
  settlement_letter_url TEXT,
  payslip_url TEXT,
  
  -- Approval
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_final_settlements_employee_id ON final_settlements(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_final_settlements_company_id ON final_settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_final_settlements_payment_status ON final_settlements(payment_status);

-- 4. Experience Certificates Table
CREATE TABLE IF NOT EXISTS experience_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Certificate Details
  certificate_type TEXT DEFAULT 'experience' CHECK (certificate_type IN (
    'experience', 'service', 'appreciation', 'completion'
  )),
  certificate_number TEXT UNIQUE,
  
  -- Employment Details
  position_title TEXT NOT NULL,
  department TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_service_years DECIMAL(4,2),
  total_service_months INTEGER,
  
  -- Content
  certificate_content TEXT, -- Full text of certificate
  certificate_content_ar TEXT, -- Arabic version
  achievements TEXT[], -- Key achievements
  performance_summary TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'approved', 'issued', 'delivered'
  )),
  issued_date DATE,
  delivered_date DATE,
  
  -- Documents
  certificate_pdf_url TEXT,
  
  -- Approval
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  issued_by UUID REFERENCES profiles(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_experience_certificates_employee_id ON experience_certificates(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_experience_certificates_status ON experience_certificates(status);

-- 5. Offboarding Checklists Table
CREATE TABLE IF NOT EXISTS offboarding_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Checklist Items
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {task, completed, due_date, assigned_to}
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'on_hold'
  )),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  target_completion_date DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_offboarding_checklists_employee_id ON offboarding_checklists(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_checklists_status ON offboarding_checklists(status);

-- 6. Offboarding Tasks Table
CREATE TABLE IF NOT EXISTS offboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offboarding_checklist_id UUID NOT NULL REFERENCES offboarding_checklists(id) ON DELETE CASCADE,
  
  -- Task Details
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_category TEXT CHECK (task_category IN (
    'document', 'access', 'equipment', 'settlement', 'interview', 'other'
  )),
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'skipped'
  )),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  
  -- Due Date
  due_date DATE,
  is_mandatory BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offboarding_tasks_checklist_id ON offboarding_tasks(offboarding_checklist_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_tasks_status ON offboarding_tasks(status);

-- 7. Function to update updated_at
CREATE OR REPLACE FUNCTION update_offboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exit_interviews_updated_at
  BEFORE UPDATE ON exit_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER trigger_update_document_return_tracking_updated_at
  BEFORE UPDATE ON document_return_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER trigger_update_final_settlements_updated_at
  BEFORE UPDATE ON final_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER trigger_update_experience_certificates_updated_at
  BEFORE UPDATE ON experience_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER trigger_update_offboarding_checklists_updated_at
  BEFORE UPDATE ON offboarding_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER trigger_update_offboarding_tasks_updated_at
  BEFORE UPDATE ON offboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

-- 8. Function to calculate offboarding completion
CREATE OR REPLACE FUNCTION calculate_offboarding_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  completion_pct DECIMAL(5,2);
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_items, completed_items
  FROM offboarding_tasks
  WHERE offboarding_checklist_id = NEW.offboarding_checklist_id;
  
  IF total_items > 0 THEN
    completion_pct := (completed_items::DECIMAL / total_items::DECIMAL) * 100;
  ELSE
    completion_pct := 0;
  END IF;
  
  UPDATE offboarding_checklists
  SET 
    completion_percentage = completion_pct,
    status = CASE
      WHEN completion_pct = 100 THEN 'completed'
      WHEN completion_pct > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    completed_at = CASE
      WHEN completion_pct = 100 AND completed_at IS NULL THEN NOW()
      ELSE completed_at
    END
  WHERE id = NEW.offboarding_checklist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_offboarding_completion
  AFTER INSERT OR UPDATE OF status ON offboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_offboarding_completion();

-- 9. Comments
COMMENT ON TABLE exit_interviews IS 'Exit interviews for departing employees';
COMMENT ON TABLE document_return_tracking IS 'Tracking of documents returned by departing employees';
COMMENT ON TABLE final_settlements IS 'Final financial settlements for departing employees';
COMMENT ON TABLE experience_certificates IS 'Experience and service certificates';
COMMENT ON TABLE offboarding_checklists IS 'Offboarding checklists for departing employees';
COMMENT ON TABLE offboarding_tasks IS 'Individual offboarding tasks';

