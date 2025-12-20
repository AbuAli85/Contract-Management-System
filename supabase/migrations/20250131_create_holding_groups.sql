-- ============================================================================
-- HOLDING GROUPS SYSTEM
-- ============================================================================
-- This migration creates a system to manage holding groups and their
-- relationships with companies/parties
-- ============================================================================

-- ============================================================================
-- 1. HOLDING GROUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS holding_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  CONSTRAINT holding_groups_name_en_unique UNIQUE (name_en)
);

CREATE INDEX IF NOT EXISTS idx_holding_groups_name_en ON holding_groups(name_en);
CREATE INDEX IF NOT EXISTS idx_holding_groups_is_active ON holding_groups(is_active);

-- ============================================================================
-- 2. HOLDING GROUP MEMBERS (Links parties/companies to holding groups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS holding_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holding_group_id UUID NOT NULL REFERENCES holding_groups(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN ('party', 'company')),
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Ensure a party/company can only belong to one holding group
  CONSTRAINT holding_group_members_party_unique UNIQUE (party_id) 
    WHERE party_id IS NOT NULL,
  CONSTRAINT holding_group_members_company_unique UNIQUE (company_id) 
    WHERE company_id IS NOT NULL,
  -- Ensure either party_id or company_id is set
  CONSTRAINT holding_group_members_member_check 
    CHECK ((party_id IS NOT NULL AND company_id IS NULL) OR 
           (party_id IS NULL AND company_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_holding_group_members_holding_group_id ON holding_group_members(holding_group_id);
CREATE INDEX IF NOT EXISTS idx_holding_group_members_party_id ON holding_group_members(party_id);
CREATE INDEX IF NOT EXISTS idx_holding_group_members_company_id ON holding_group_members(company_id);

-- ============================================================================
-- 3. TRADEMARKS/BRANDS TABLE (For Digital Morph type entities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trademarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  parent_party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  parent_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  CONSTRAINT trademarks_name_unique UNIQUE (name),
  -- Ensure either parent_party_id or parent_company_id is set
  CONSTRAINT trademarks_parent_check 
    CHECK ((parent_party_id IS NOT NULL AND parent_company_id IS NULL) OR 
           (parent_party_id IS NULL AND parent_company_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_trademarks_parent_party_id ON trademarks(parent_party_id);
CREATE INDEX IF NOT EXISTS idx_trademarks_parent_company_id ON trademarks(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_trademarks_is_active ON trademarks(is_active);

-- ============================================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_holding_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_holding_groups_updated_at
  BEFORE UPDATE ON holding_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_holding_groups_updated_at();

CREATE TRIGGER trigger_holding_group_members_updated_at
  BEFORE UPDATE ON holding_group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_holding_groups_updated_at();

CREATE TRIGGER trigger_trademarks_updated_at
  BEFORE UPDATE ON trademarks
  FOR EACH ROW
  EXECUTE FUNCTION update_holding_groups_updated_at();

-- ============================================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE holding_groups IS 'Holding groups that manage multiple companies (e.g., Falcon Eye Group)';
COMMENT ON TABLE holding_group_members IS 'Links parties/companies to holding groups';
COMMENT ON TABLE trademarks IS 'Trademarks/brands that operate under a parent company (e.g., Digital Morph under Falcon Eye Modern Investments)';

COMMENT ON COLUMN holding_group_members.member_type IS 'Type of member: party or company';
COMMENT ON COLUMN trademarks.parent_party_id IS 'Parent party/company that owns this trademark';
COMMENT ON COLUMN trademarks.parent_company_id IS 'Parent company that owns this trademark';

