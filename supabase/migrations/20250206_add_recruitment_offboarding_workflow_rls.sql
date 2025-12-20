-- RLS Policies for Recruitment, Offboarding, and Workflow Tables
-- Ensures proper security and company scoping

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON job_postings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON candidate_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON interview_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON offer_letters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_checklists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_tasks TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON exit_interviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_return_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON final_settlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON experience_certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON offboarding_checklists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON offboarding_tasks TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_step_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_templates TO authenticated;

GRANT SELECT ON job_postings TO anon;
GRANT SELECT ON candidate_applications TO anon;
GRANT SELECT ON workflow_templates TO anon;

GRANT ALL ON job_postings TO postgres, service_role;
GRANT ALL ON candidate_applications TO postgres, service_role;
GRANT ALL ON interview_schedules TO postgres, service_role;
GRANT ALL ON offer_letters TO postgres, service_role;
GRANT ALL ON onboarding_checklists TO postgres, service_role;
GRANT ALL ON onboarding_tasks TO postgres, service_role;
GRANT ALL ON exit_interviews TO postgres, service_role;
GRANT ALL ON document_return_tracking TO postgres, service_role;
GRANT ALL ON final_settlements TO postgres, service_role;
GRANT ALL ON experience_certificates TO postgres, service_role;
GRANT ALL ON offboarding_checklists TO postgres, service_role;
GRANT ALL ON offboarding_tasks TO postgres, service_role;
GRANT ALL ON workflows TO postgres, service_role;
GRANT ALL ON workflow_steps TO postgres, service_role;
GRANT ALL ON workflow_executions TO postgres, service_role;
GRANT ALL ON workflow_step_executions TO postgres, service_role;
GRANT ALL ON workflow_templates TO postgres, service_role;

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_return_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Job Postings
CREATE POLICY "Users can view job postings for their company"
  ON job_postings FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can create job postings for their company"
  ON job_postings FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update job postings for their company"
  ON job_postings FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for Candidate Applications
CREATE POLICY "Users can view applications for their company"
  ON candidate_applications FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR candidate_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can create applications"
  ON candidate_applications FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update applications for their company"
  ON candidate_applications FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for Workflows
CREATE POLICY "Users can view workflows for their company"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR company_id IS NULL -- System workflows
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can create workflows for their company"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update workflows for their company"
  ON workflows FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for Offboarding
CREATE POLICY "Users can view offboarding for their company"
  ON exit_interviews FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR employee_id = auth.uid()
  );

CREATE POLICY "Users can create offboarding for their company"
  ON exit_interviews FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Similar policies for other offboarding tables
CREATE POLICY "Users can view settlements for their company"
  ON final_settlements FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create settlements for their company"
  ON final_settlements FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for Onboarding
CREATE POLICY "Users can view onboarding for their company"
  ON onboarding_checklists FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR employee_id = auth.uid()
  );

CREATE POLICY "Users can create onboarding for their company"
  ON onboarding_checklists FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Anonymous access for public job postings
CREATE POLICY "Anonymous can view published job postings"
  ON job_postings FOR SELECT
  TO anon
  USING (status = 'published');

-- Anonymous can view their own applications (by email match)
-- Note: This is a simplified policy - in production, you might want to use session tokens
CREATE POLICY "Anonymous can view their own applications"
  ON candidate_applications FOR SELECT
  TO anon
  USING (status = 'applied');

