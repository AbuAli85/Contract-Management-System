-- Create parties table with EXACT structure matching the CSV file
-- This table structure matches the CSV columns from parties-export-2025-08-01.csv

-- Drop existing table if it exists (be careful with this in production)
DROP TABLE IF EXISTS parties CASCADE;

CREATE TABLE parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,                    -- Name (EN)
    name_ar TEXT,                             -- Name (AR)
    crn TEXT,                                 -- CRN
    type TEXT,                                -- Type (Employer/Client)
    role TEXT,                                -- Role
    status TEXT,                              -- Status
    cr_status TEXT,                           -- CR Status
    cr_expiry TEXT,                           -- CR Expiry
    license_status TEXT,                      -- License Status
    license_expiry TEXT,                      -- License Expiry
    contact_person TEXT,                      -- Contact Person
    contact_email TEXT,                       -- Contact Email
    contact_phone TEXT,                       -- Contact Phone
    address_en TEXT,                          -- Address (EN)
    tax_number TEXT,                          -- Tax Number
    license_number TEXT,                      -- License Number
    active_contracts INTEGER DEFAULT 0,       -- Active Contracts
    overall_status TEXT DEFAULT 'active',     -- Overall Status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- Created At
    notes TEXT,                               -- Notes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_parties_name_en ON parties(name_en);
CREATE INDEX idx_parties_crn ON parties(crn);
CREATE INDEX idx_parties_type ON parties(type);
CREATE INDEX idx_parties_overall_status ON parties(overall_status);

-- Add comments for documentation
COMMENT ON TABLE parties IS 'Parties table with exact structure matching CSV export';
COMMENT ON COLUMN parties.name_en IS 'Company name in English';
COMMENT ON COLUMN parties.name_ar IS 'Company name in Arabic';
COMMENT ON COLUMN parties.crn IS 'Commercial Registration Number';
COMMENT ON COLUMN parties.type IS 'Type of party: Employer or Client';
COMMENT ON COLUMN parties.role IS 'Role within the organization (e.g., ceo)';
COMMENT ON COLUMN parties.overall_status IS 'Overall status of the party (active, inactive, etc.)';
COMMENT ON COLUMN parties.active_contracts IS 'Number of active contracts';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_parties_updated_at 
    BEFORE UPDATE ON parties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all users" ON parties
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON parties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON parties
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON parties
    FOR DELETE USING (auth.role() = 'authenticated'); 