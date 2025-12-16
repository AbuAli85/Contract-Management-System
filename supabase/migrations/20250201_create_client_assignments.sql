-- Client Assignment System
-- Tracks employee assignments to clients with deployment letter integration

-- 1. Client Assignments Table
CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  client_party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  assignment_type TEXT DEFAULT 'deployment' CHECK (assignment_type IN (
    'deployment',
    'temporary',
    'project',
    'consultation',
    'training'
  )),
  job_title TEXT NOT NULL,
  department TEXT,
  work_location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',
    'completed',
    'terminated',
    'transferred',
    'on_hold'
  )),
  deployment_letter_id UUID REFERENCES contracts(id), -- Link to deployment letter contract
  assignment_terms JSONB DEFAULT '{}', -- Additional terms and conditions
  client_contact_person TEXT,
  client_contact_email TEXT,
  client_contact_phone TEXT,
  salary_at_assignment DECIMAL(12,2), -- Salary at time of assignment
  currency TEXT DEFAULT 'OMR',
  notes TEXT,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_client_assignments_employer_employee_id ON client_assignments(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_client_party_id ON client_assignments(client_party_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_status ON client_assignments(status);
CREATE INDEX IF NOT EXISTS idx_client_assignments_dates ON client_assignments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_client_assignments_deployment_letter ON client_assignments(deployment_letter_id);

-- 2. Assignment Performance Tracking
CREATE TABLE IF NOT EXISTS assignment_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES client_assignments(id) ON DELETE CASCADE,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  internal_rating INTEGER CHECK (internal_rating >= 1 AND internal_rating <= 5),
  internal_feedback TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}', -- Custom metrics (e.g., tasks_completed, attendance_rate)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT assignment_performance_unique_period UNIQUE (assignment_id, review_period_start, review_period_end)
);

CREATE INDEX IF NOT EXISTS idx_assignment_performance_assignment_id ON assignment_performance(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_performance_dates ON assignment_performance(review_period_start, review_period_end);

-- 3. Assignment Transfers (track assignment history)
CREATE TABLE IF NOT EXISTS assignment_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_assignment_id UUID NOT NULL REFERENCES client_assignments(id) ON DELETE CASCADE,
  to_assignment_id UUID REFERENCES client_assignments(id), -- NULL if terminated
  transfer_type TEXT NOT NULL CHECK (transfer_type IN (
    'client_change',
    'role_change',
    'location_change',
    'termination'
  )),
  transfer_date DATE NOT NULL,
  reason TEXT,
  transferred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_transfers_from ON assignment_transfers(from_assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_transfers_to ON assignment_transfers(to_assignment_id);

-- Enable Row Level Security
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_assignments
CREATE POLICY "Employers can view their employees' assignments"
  ON client_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = client_assignments.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employers can manage their employees' assignments"
  ON client_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = client_assignments.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view their own assignments"
  ON client_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = client_assignments.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- RLS Policies for assignment_performance
CREATE POLICY "Users can view performance for accessible assignments"
  ON assignment_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments ca
      JOIN employer_employees ee ON ee.id = ca.employer_employee_id
      WHERE ca.id = assignment_performance.assignment_id
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

CREATE POLICY "Employers can manage performance records"
  ON assignment_performance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments ca
      JOIN employer_employees ee ON ee.id = ca.employer_employee_id
      WHERE ca.id = assignment_performance.assignment_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policies for assignment_transfers
CREATE POLICY "Users can view transfers for accessible assignments"
  ON assignment_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments ca
      JOIN employer_employees ee ON ee.id = ca.employer_employee_id
      WHERE ca.id = assignment_transfers.from_assignment_id
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
CREATE OR REPLACE FUNCTION update_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_client_assignments_updated_at
  BEFORE UPDATE ON client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_updated_at();

CREATE TRIGGER update_assignment_performance_updated_at
  BEFORE UPDATE ON assignment_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_updated_at();

-- Function to automatically update assignment status based on dates
CREATE OR REPLACE FUNCTION check_assignment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If end_date is in the past and status is active, mark as completed
  IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE AND NEW.status = 'active' THEN
    NEW.status = 'completed';
  END IF;
  
  -- If start_date is in the future, status should be on_hold
  IF NEW.start_date > CURRENT_DATE AND NEW.status = 'active' THEN
    NEW.status = 'on_hold';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_assignment_status_trigger
  BEFORE INSERT OR UPDATE ON client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_assignment_status();

-- Comments for documentation
COMMENT ON TABLE client_assignments IS 'Tracks employee assignments to clients';
COMMENT ON TABLE assignment_performance IS 'Tracks performance reviews for assignments';
COMMENT ON TABLE assignment_transfers IS 'Tracks assignment history and transfers';

