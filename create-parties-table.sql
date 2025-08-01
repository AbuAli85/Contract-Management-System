-- Create parties table with proper structure for CSV import
-- This table structure matches the CSV columns from parties-export-2025-08-01.csv

CREATE TABLE IF NOT EXISTS parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    crn TEXT,
    type TEXT CHECK (type IN ('Employer', 'Client', 'Generic', NULL)),
    role TEXT,
    status TEXT,
    cr_status TEXT,
    cr_expiry TEXT,
    license_status TEXT,
    license_expiry TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address_en TEXT,
    tax_number TEXT,
    license_number TEXT,
    active_contracts INTEGER DEFAULT 0,
    overall_status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parties_name_en ON parties(name_en);
CREATE INDEX IF NOT EXISTS idx_parties_crn ON parties(crn);
CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(type);
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(overall_status);

-- Add comments for documentation
COMMENT ON TABLE parties IS 'Parties table for storing employer and client information';
COMMENT ON COLUMN parties.name_en IS 'Company name in English';
COMMENT ON COLUMN parties.name_ar IS 'Company name in Arabic';
COMMENT ON COLUMN parties.crn IS 'Commercial Registration Number';
COMMENT ON COLUMN parties.type IS 'Type of party: Employer, Client, or Generic';
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