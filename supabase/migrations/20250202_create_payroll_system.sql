-- Payroll System Migration
-- Creates comprehensive payroll management with salary structures, payroll runs, and payslips

-- 1. Salary Structures Table
CREATE TABLE IF NOT EXISTS salary_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  basic_salary DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'OMR',
  allowances JSONB DEFAULT '{}', -- {housing: 100, transport: 50, food: 30, etc.}
  deductions JSONB DEFAULT '{}', -- {tax: 50, insurance: 30, loan: 100, etc.}
  overtime_rate DECIMAL(8,2) DEFAULT 1.5, -- Multiplier for overtime (e.g., 1.5x = time and a half)
  bonus_structure JSONB DEFAULT '{}', -- {performance: 500, annual: 1000, etc.}
  effective_from DATE NOT NULL,
  effective_to DATE, -- NULL means currently active
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_structures_employer_employee_id ON salary_structures(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_status ON salary_structures(status);
CREATE INDEX IF NOT EXISTS idx_salary_structures_effective_dates ON salary_structures(effective_from, effective_to);

-- Ensure only one active structure per employee at a time (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_structures_unique_active 
  ON salary_structures(employer_employee_id) 
  WHERE status = 'active';

-- 2. Payroll Runs Table
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  payroll_month DATE NOT NULL, -- First day of the month
  payroll_period TEXT DEFAULT 'monthly' CHECK (payroll_period IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'review', 'approved', 'paid', 'cancelled')),
  total_amount DECIMAL(12,2) DEFAULT 0,
  total_employees INTEGER DEFAULT 0,
  total_basic_salary DECIMAL(12,2) DEFAULT 0,
  total_allowances DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  total_overtime DECIMAL(12,2) DEFAULT 0,
  total_bonus DECIMAL(12,2) DEFAULT 0,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  payment_date DATE, -- When payroll was actually paid
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one payroll run per month per company
  CONSTRAINT payroll_runs_unique_month UNIQUE (company_id, payroll_month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_company_id ON payroll_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_month ON payroll_runs(payroll_month);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);

-- 3. Payroll Entries Table (Individual payslips)
CREATE TABLE IF NOT EXISTS payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  salary_structure_id UUID REFERENCES salary_structures(id),
  
  -- Salary breakdown
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  allowances DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  bonus DECIMAL(12,2) DEFAULT 0,
  gross_salary DECIMAL(12,2) DEFAULT 0, -- basic + allowances + overtime + bonus
  net_salary DECIMAL(12,2) DEFAULT 0, -- gross - deductions
  
  -- Attendance data for this period
  working_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  overtime_days INTEGER DEFAULT 0,
  
  -- Payslip details
  payslip_url TEXT, -- URL to generated payslip PDF
  payslip_generated_at TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'on_hold')),
  payment_date DATE,
  payment_method TEXT, -- 'bank_transfer', 'cash', 'cheque', etc.
  payment_reference TEXT, -- Transaction reference
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one entry per employee per payroll run
  CONSTRAINT payroll_entries_unique UNIQUE (payroll_run_id, employer_employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_payroll_run_id ON payroll_entries(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_employer_employee_id ON payroll_entries(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_payment_status ON payroll_entries(payment_status);

-- 4. Salary History Table (Track salary changes over time)
CREATE TABLE IF NOT EXISTS salary_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  salary_structure_id UUID REFERENCES salary_structures(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('hiring', 'increment', 'decrement', 'promotion', 'adjustment', 'bonus')),
  previous_salary DECIMAL(12,2),
  new_salary DECIMAL(12,2),
  change_amount DECIMAL(12,2),
  change_percentage DECIMAL(5,2),
  effective_date DATE NOT NULL,
  reason TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_history_employer_employee_id ON salary_history(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_effective_date ON salary_history(effective_date);

-- Enable Row Level Security
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Salary Structures
CREATE POLICY "Employers can manage salary structures"
  ON salary_structures FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = salary_structures.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view their own salary structures"
  ON salary_structures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = salary_structures.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- RLS Policies for Payroll Runs
CREATE POLICY "Company members can view payroll runs"
  ON payroll_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND active_company_id = payroll_runs.company_id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "HR and admins can manage payroll runs"
  ON payroll_runs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'hr_manager' OR role = 'manager')
      AND active_company_id = payroll_runs.company_id
    )
  );

-- RLS Policies for Payroll Entries
CREATE POLICY "Employers can view payroll entries"
  ON payroll_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = payroll_entries.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN payroll_runs pr ON pr.company_id = p.active_company_id
      WHERE p.id = auth.uid()
      AND pr.id = payroll_entries.payroll_run_id
      AND (p.role = 'admin' OR p.role = 'hr_manager' OR p.role = 'manager')
    )
  );

CREATE POLICY "Employees can view their own payroll entries"
  ON payroll_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = payroll_entries.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

CREATE POLICY "HR and admins can manage payroll entries"
  ON payroll_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN payroll_runs pr ON pr.company_id = p.active_company_id
      WHERE p.id = auth.uid()
      AND pr.id = payroll_entries.payroll_run_id
      AND (p.role = 'admin' OR p.role = 'hr_manager' OR p.role = 'manager')
    )
  );

-- RLS Policies for Salary History
CREATE POLICY "Employers can view salary history"
  ON salary_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = salary_history.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view their own salary history"
  ON salary_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = salary_history.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payroll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_salary_structures_updated_at
  BEFORE UPDATE ON salary_structures
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_runs_updated_at
  BEFORE UPDATE ON payroll_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_entries_updated_at
  BEFORE UPDATE ON payroll_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_updated_at();

-- Function to calculate gross and net salary
CREATE OR REPLACE FUNCTION calculate_payroll_amounts()
RETURNS TRIGGER AS $$
DECLARE
  total_allowances DECIMAL(12,2) := 0;
  total_deductions DECIMAL(12,2) := 0;
  allowance_value DECIMAL(12,2);
  deduction_value DECIMAL(12,2);
BEGIN
  -- Calculate total allowances from JSONB
  IF NEW.allowances IS NOT NULL THEN
    SELECT COALESCE(SUM((value::text)::DECIMAL(12,2)), 0)
    INTO total_allowances
    FROM jsonb_each_text(NEW.allowances);
  END IF;
  
  -- Calculate total deductions from JSONB
  IF NEW.deductions IS NOT NULL THEN
    SELECT COALESCE(SUM((value::text)::DECIMAL(12,2)), 0)
    INTO total_deductions
    FROM jsonb_each_text(NEW.deductions);
  END IF;
  
  -- Set calculated values
  NEW.allowances = total_allowances;
  NEW.deductions = total_deductions;
  NEW.gross_salary = NEW.basic_salary + total_allowances + NEW.overtime_pay + NEW.bonus;
  NEW.net_salary = NEW.gross_salary - total_deductions;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate payroll amounts
CREATE TRIGGER calculate_payroll_amounts_trigger
  BEFORE INSERT OR UPDATE ON payroll_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payroll_amounts();

-- Comments for documentation
COMMENT ON TABLE salary_structures IS 'Salary structures for employees with allowances and deductions';
COMMENT ON TABLE payroll_runs IS 'Monthly/periodic payroll processing runs';
COMMENT ON TABLE payroll_entries IS 'Individual payslips for each employee in a payroll run';
COMMENT ON TABLE salary_history IS 'Historical record of salary changes';

