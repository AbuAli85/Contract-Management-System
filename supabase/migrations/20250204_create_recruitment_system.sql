-- Recruitment & Onboarding System
-- Complete system for job postings, candidate management, and onboarding

-- 1. Job Postings Table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  
  -- Job Details
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  department TEXT,
  job_type TEXT NOT NULL CHECK (job_type IN (
    'full_time', 'part_time', 'contract', 'temporary', 'internship'
  )),
  location TEXT,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  currency TEXT DEFAULT 'OMR',
  experience_required INTEGER, -- Years of experience
  education_required TEXT,
  
  -- Requirements
  required_skills TEXT[],
  preferred_skills TEXT[],
  required_documents TEXT[],
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'closed', 'cancelled'
  )),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  application_deadline DATE,
  
  -- Metadata
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON job_postings(job_type);

-- 2. Candidate Applications Table
CREATE TABLE IF NOT EXISTS candidate_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES profiles(id), -- If candidate has profile
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Candidate Information (if no profile)
  candidate_name_en TEXT,
  candidate_name_ar TEXT,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  candidate_nationality TEXT,
  
  -- Application Details
  cover_letter TEXT,
  expected_salary DECIMAL(12,2),
  available_start_date DATE,
  notice_period_days INTEGER,
  
  -- Application Status
  status TEXT DEFAULT 'applied' CHECK (status IN (
    'applied', 'screening', 'interview_scheduled', 'interviewed', 
    'shortlisted', 'offer_sent', 'offer_accepted', 'offer_rejected',
    'rejected', 'withdrawn', 'hired'
  )),
  current_stage TEXT, -- Current stage in process
  
  -- Documents
  resume_url TEXT,
  cover_letter_url TEXT,
  other_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Interview & Evaluation
  interview_notes TEXT,
  evaluation_score DECIMAL(3,2), -- 0.00 to 10.00
  evaluation_notes TEXT,
  evaluated_by UUID REFERENCES profiles(id),
  evaluated_at TIMESTAMPTZ,
  
  -- Metadata
  source TEXT, -- How candidate found the job
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_job_posting_id ON candidate_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_candidate_id ON candidate_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_status ON candidate_applications(status);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_company_id ON candidate_applications(company_id);

-- 3. Interview Schedules Table
CREATE TABLE IF NOT EXISTS interview_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL CHECK (interview_type IN (
    'phone', 'video', 'in_person', 'panel', 'technical', 'final'
  )),
  interview_round INTEGER DEFAULT 1,
  
  -- Schedule
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT, -- For in-person interviews
  meeting_link TEXT, -- For video interviews
  
  -- Interviewers
  interviewer_ids UUID[] NOT NULL, -- Array of profile IDs
  interviewer_names TEXT[], -- Names if not in system
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'
  )),
  cancelled_reason TEXT,
  rescheduled_from_id UUID REFERENCES interview_schedules(id),
  
  -- Results
  interview_notes TEXT,
  feedback JSONB DEFAULT '[]'::jsonb, -- Feedback from each interviewer
  overall_rating DECIMAL(3,2),
  recommendation TEXT, -- 'hire', 'maybe', 'reject'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_at ON interview_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);

-- 4. Offer Letters Table
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES job_postings(id),
  
  -- Offer Details
  position_title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  salary DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'OMR',
  benefits JSONB DEFAULT '{}'::jsonb,
  terms_and_conditions TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'accepted', 'rejected', 'expired', 'withdrawn'
  )),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expiry_date DATE,
  
  -- Documents
  offer_letter_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_offer_letters_application_id ON offer_letters(application_id);
CREATE INDEX IF NOT EXISTS idx_offer_letters_status ON offer_letters(status);

-- 5. Onboarding Checklists Table
CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employer_employee_id UUID REFERENCES employer_employees(id) ON DELETE CASCADE,
  
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

CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_employee_id ON onboarding_checklists(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_company_id ON onboarding_checklists(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_status ON onboarding_checklists(status);

-- 6. Onboarding Tasks Table
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_checklist_id UUID NOT NULL REFERENCES onboarding_checklists(id) ON DELETE CASCADE,
  
  -- Task Details
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_category TEXT CHECK (task_category IN (
    'document', 'training', 'setup', 'orientation', 'other'
  )),
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id), -- Who should complete this
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

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_checklist_id ON onboarding_tasks(onboarding_checklist_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status ON onboarding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_assigned_to ON onboarding_tasks(assigned_to);

-- 7. Function to update updated_at
CREATE OR REPLACE FUNCTION update_recruitment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

CREATE TRIGGER trigger_update_candidate_applications_updated_at
  BEFORE UPDATE ON candidate_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

CREATE TRIGGER trigger_update_interview_schedules_updated_at
  BEFORE UPDATE ON interview_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

CREATE TRIGGER trigger_update_offer_letters_updated_at
  BEFORE UPDATE ON offer_letters
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

CREATE TRIGGER trigger_update_onboarding_checklists_updated_at
  BEFORE UPDATE ON onboarding_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

CREATE TRIGGER trigger_update_onboarding_tasks_updated_at
  BEFORE UPDATE ON onboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

-- 8. Function to calculate onboarding completion
CREATE OR REPLACE FUNCTION calculate_onboarding_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  completion_pct DECIMAL(5,2);
BEGIN
  -- Count total and completed items
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_items, completed_items
  FROM onboarding_tasks
  WHERE onboarding_checklist_id = NEW.onboarding_checklist_id;
  
  -- Calculate percentage
  IF total_items > 0 THEN
    completion_pct := (completed_items::DECIMAL / total_items::DECIMAL) * 100;
  ELSE
    completion_pct := 0;
  END IF;
  
  -- Update checklist
  UPDATE onboarding_checklists
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
  WHERE id = NEW.onboarding_checklist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_onboarding_completion
  AFTER INSERT OR UPDATE OF status ON onboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_onboarding_completion();

-- 9. Comments
COMMENT ON TABLE job_postings IS 'Job postings for recruitment';
COMMENT ON TABLE candidate_applications IS 'Candidate applications for job postings';
COMMENT ON TABLE interview_schedules IS 'Interview scheduling and management';
COMMENT ON TABLE offer_letters IS 'Job offer letters and management';
COMMENT ON TABLE onboarding_checklists IS 'Onboarding checklists for new employees';
COMMENT ON TABLE onboarding_tasks IS 'Individual onboarding tasks';

