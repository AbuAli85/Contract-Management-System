-- RLS Policies and Permissions for Work Permit Management
-- Based on Ministry of Labour workflow requirements

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON work_permit_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_permit_renewals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_permit_compliance TO authenticated;

GRANT SELECT ON work_permit_applications TO anon;
GRANT SELECT ON work_permit_renewals TO anon;
GRANT SELECT ON work_permit_compliance TO anon;

GRANT ALL ON work_permit_applications TO postgres, service_role;
GRANT ALL ON work_permit_renewals TO postgres, service_role;
GRANT ALL ON work_permit_compliance TO postgres, service_role;

-- Enable RLS
ALTER TABLE work_permit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_permit_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_permit_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_permit_applications
-- Authenticated users can view their own applications or applications for their company
CREATE POLICY "Users can view work permit applications for their company"
  ON work_permit_applications
  FOR SELECT
  TO authenticated
  USING (
    -- User is the employer
    employer_id = auth.uid()
    OR
    -- User is the employee
    employee_id = auth.uid()
    OR
    -- User is admin/manager
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    OR
    -- User's company matches employer's company
    EXISTS (
      SELECT 1 FROM company_members cm1
      JOIN company_members cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = employer_id
      AND cm1.status = 'active'
      AND cm2.status = 'active'
    )
  );

-- Authenticated users can create applications for their company
CREATE POLICY "Users can create work permit applications"
  ON work_permit_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is the employer
    employer_id = auth.uid()
    OR
    -- User is admin/manager
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    OR
    -- User's company matches employer's company
    EXISTS (
      SELECT 1 FROM company_members cm1
      JOIN company_members cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = employer_id
      AND cm1.status = 'active'
      AND cm2.status = 'active'
    )
  );

-- Authenticated users can update their own applications
CREATE POLICY "Users can update work permit applications"
  ON work_permit_applications
  FOR UPDATE
  TO authenticated
  USING (
    -- User is the employer
    employer_id = auth.uid()
    OR
    -- User is admin/manager
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    -- Same conditions for update
    employer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Authenticated users can delete draft applications
CREATE POLICY "Users can delete draft work permit applications"
  ON work_permit_applications
  FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND (
      employer_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
      )
    )
  );

-- RLS Policies for work_permit_renewals
CREATE POLICY "Users can view work permit renewals"
  ON work_permit_renewals
  FOR SELECT
  TO authenticated
  USING (
    -- User is admin/manager
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    OR
    -- User is employer of the application
    EXISTS (
      SELECT 1 FROM work_permit_applications wpa
      WHERE wpa.id = work_permit_renewals.work_permit_application_id
      AND wpa.employer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create work permit renewals"
  ON work_permit_renewals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    OR
    EXISTS (
      SELECT 1 FROM work_permit_applications wpa
      WHERE wpa.id = work_permit_renewals.work_permit_application_id
      AND wpa.employer_id = auth.uid()
    )
  );

CREATE POLICY "Users can update work permit renewals"
  ON work_permit_renewals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    OR
    EXISTS (
      SELECT 1 FROM work_permit_applications wpa
      WHERE wpa.id = work_permit_renewals.work_permit_application_id
      AND wpa.employer_id = auth.uid()
    )
  );

-- RLS Policies for work_permit_compliance
CREATE POLICY "Users can view work permit compliance"
  ON work_permit_compliance
  FOR SELECT
  TO authenticated
  USING (
    -- User is the employer
    employer_id = auth.uid()
    OR
    -- User is the employee
    employee_id = auth.uid()
    OR
    -- User is admin/manager
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    OR
    -- User's company matches employer's company
    EXISTS (
      SELECT 1 FROM company_members cm1
      JOIN company_members cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = employer_id
      AND cm1.status = 'active'
      AND cm2.status = 'active'
    )
  );

CREATE POLICY "Users can update work permit compliance"
  ON work_permit_compliance
  FOR UPDATE
  TO authenticated
  USING (
    employer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Anonymous read access for public compliance status (limited)
CREATE POLICY "Anonymous can view limited compliance data"
  ON work_permit_compliance
  FOR SELECT
  TO anon
  USING (compliance_status IN ('compliant', 'expiring_soon'));

