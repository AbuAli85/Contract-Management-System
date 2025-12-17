-- Letters System Migration
-- Creates comprehensive letter generation and management system

-- 1. HR Letters Table
CREATE TABLE IF NOT EXISTS hr_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_employee_id UUID NOT NULL REFERENCES employer_employees(id) ON DELETE CASCADE,
  letter_type TEXT NOT NULL CHECK (letter_type IN (
    'salary_certificate',
    'official',
    'leave',
    'employment',
    'experience',
    'no_objection',
    'transfer',
    'termination',
    'warning',
    'appreciation',
    'custom'
  )),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  pdf_url TEXT, -- URL to generated PDF
  template_id UUID, -- Reference to letter template if used
  additional_data JSONB DEFAULT '{}', -- Additional context data
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'archived')),
  generated_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_to TEXT, -- Email or recipient info
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_letters_employer_employee_id ON hr_letters(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_letters_letter_type ON hr_letters(letter_type);
CREATE INDEX IF NOT EXISTS idx_hr_letters_status ON hr_letters(status);
CREATE INDEX IF NOT EXISTS idx_hr_letters_created_at ON hr_letters(created_at);

-- 2. Letter Templates Table
CREATE TABLE IF NOT EXISTS letter_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  letter_type TEXT NOT NULL CHECK (letter_type IN (
    'salary_certificate',
    'official',
    'leave',
    'employment',
    'experience',
    'no_objection',
    'transfer',
    'termination',
    'warning',
    'appreciation',
    'custom'
  )),
  subject_template TEXT NOT NULL,
  content_template TEXT NOT NULL, -- Can include placeholders like {{employee_name}}, {{salary}}, etc.
  placeholders JSONB DEFAULT '[]', -- List of available placeholders
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_letter_templates_company_id ON letter_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_letter_templates_letter_type ON letter_templates(letter_type);
CREATE INDEX IF NOT EXISTS idx_letter_templates_is_default ON letter_templates(is_default);

-- Enable Row Level Security
ALTER TABLE hr_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for HR Letters
CREATE POLICY "Employers can manage letters"
  ON hr_letters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = hr_letters.employer_employee_id
      AND ee.employer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employer_employees ee ON ee.company_id = p.active_company_id
      WHERE p.id = auth.uid()
      AND ee.id = hr_letters.employer_employee_id
      AND (p.role = 'admin' OR p.role = 'hr_manager' OR p.role = 'manager')
    )
  );

CREATE POLICY "Employees can view their own letters"
  ON hr_letters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = hr_letters.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- RLS Policies for Letter Templates
CREATE POLICY "Company members can view templates"
  ON letter_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND active_company_id = letter_templates.company_id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "HR and admins can manage templates"
  ON letter_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'hr_manager' OR role = 'manager')
      AND active_company_id = letter_templates.company_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_letters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_hr_letters_updated_at
  BEFORE UPDATE ON hr_letters
  FOR EACH ROW
  EXECUTE FUNCTION update_letters_updated_at();

CREATE TRIGGER update_letter_templates_updated_at
  BEFORE UPDATE ON letter_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_letters_updated_at();

-- Comments for documentation
COMMENT ON TABLE hr_letters IS 'Generated letters for employees (salary certificates, official letters, etc.)';
COMMENT ON TABLE letter_templates IS 'Reusable letter templates for different letter types';

