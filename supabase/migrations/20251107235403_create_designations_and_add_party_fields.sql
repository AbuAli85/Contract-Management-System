-- ================================================================
-- Migration: Create Designations Table and Add Party Fields
-- Date: 2025-11-07
-- Purpose: 
--   1. Create designations table for party designations
--   2. Add designation_id, signatory_name_en, signatory_name_ar to parties table
-- ================================================================

-- ================================================================
-- PART 1: CREATE DESIGNATIONS TABLE
-- ================================================================

-- Create designations table if it doesn't exist
CREATE TABLE IF NOT EXISTS designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT designations_name_en_unique UNIQUE (name_en),
  CONSTRAINT designations_name_ar_unique UNIQUE (name_ar)
);

-- Create index on is_active for filtering active designations
CREATE INDEX IF NOT EXISTS idx_designations_is_active ON designations(is_active);

-- Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_designations_display_order ON designations(display_order);

-- Create index on category for filtering by category
CREATE INDEX IF NOT EXISTS idx_designations_category ON designations(category) WHERE category IS NOT NULL;

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_designations_updated_at ON designations;
CREATE TRIGGER update_designations_updated_at
  BEFORE UPDATE ON designations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default designations if table is empty
INSERT INTO designations (name_en, name_ar, category, is_active, display_order)
SELECT * FROM (VALUES
  ('Chief Executive Officer', 'الرئيس التنفيذي', 'executive', true, 1),
  ('Chief Operating Officer', 'الرئيس التنفيذي للعمليات', 'executive', true, 2),
  ('Chief Financial Officer', 'الرئيس المالي', 'executive', true, 3),
  ('Managing Director', 'المدير العام', 'executive', true, 4),
  ('General Manager', 'المدير العام', 'management', true, 5),
  ('Director', 'مدير', 'management', true, 6),
  ('Manager', 'مدير', 'management', true, 7),
  ('Deputy Manager', 'نائب المدير', 'management', true, 8),
  ('Assistant Manager', 'مساعد المدير', 'management', true, 9),
  ('Supervisor', 'مشرف', 'supervisory', true, 10),
  ('Coordinator', 'منسق', 'administrative', true, 11),
  ('Secretary', 'سكرتير', 'administrative', true, 12),
  ('Legal Advisor', 'مستشار قانوني', 'legal', true, 13),
  ('Accountant', 'محاسب', 'finance', true, 14),
  ('Representative', 'ممثل', 'general', true, 15)
) AS v(name_en, name_ar, category, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM designations);

-- ================================================================
-- PART 2: ADD FIELDS TO PARTIES TABLE
-- ================================================================

-- Add designation_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'parties' 
    AND column_name = 'designation_id'
  ) THEN
    ALTER TABLE parties ADD COLUMN designation_id UUID REFERENCES designations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_parties_designation_id ON parties(designation_id);
  END IF;
END $$;

-- Add signatory_name_en column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'parties' 
    AND column_name = 'signatory_name_en'
  ) THEN
    ALTER TABLE parties ADD COLUMN signatory_name_en TEXT;
  END IF;
END $$;

-- Add signatory_name_ar column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'parties' 
    AND column_name = 'signatory_name_ar'
  ) THEN
    ALTER TABLE parties ADD COLUMN signatory_name_ar TEXT;
  END IF;
END $$;

-- ================================================================
-- PART 3: RLS POLICIES FOR DESIGNATIONS TABLE
-- ================================================================

-- Enable RLS on designations table
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active designations
DROP POLICY IF EXISTS "Anyone can read active designations" ON designations;
CREATE POLICY "Anyone can read active designations"
  ON designations
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can read all designations
DROP POLICY IF EXISTS "Authenticated users can read all designations" ON designations;
CREATE POLICY "Authenticated users can read all designations"
  ON designations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert/update/delete designations
DROP POLICY IF EXISTS "Only admins can manage designations" ON designations;
CREATE POLICY "Only admins can manage designations"
  ON designations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ================================================================
-- PART 4: COMMENTS FOR DOCUMENTATION
-- ================================================================

COMMENT ON TABLE designations IS 'Stores party designations/titles (e.g., CEO, Manager, Director)';
COMMENT ON COLUMN designations.name_en IS 'Designation name in English';
COMMENT ON COLUMN designations.name_ar IS 'Designation name in Arabic';
COMMENT ON COLUMN designations.category IS 'Category of designation (executive, management, administrative, etc.)';
COMMENT ON COLUMN designations.is_active IS 'Whether this designation is currently active';
COMMENT ON COLUMN designations.display_order IS 'Order for displaying designations in dropdowns';

COMMENT ON COLUMN parties.designation_id IS 'Foreign key reference to designations table';
COMMENT ON COLUMN parties.signatory_name_en IS 'Name of the signatory in English';
COMMENT ON COLUMN parties.signatory_name_ar IS 'Name of the signatory in Arabic';

