-- Complete Database Schema Restoration Script
-- This script will recreate all tables and relationships for the Contract Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create parties table (referenced by promoters)
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('company', 'individual', 'government')),
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    registration_number TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promoters table
CREATE TABLE IF NOT EXISTS promoters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    id_card_number TEXT NOT NULL UNIQUE,
    id_card_url TEXT,
    passport_url TEXT,
    employer_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    outsourced_to_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    job_title TEXT,
    work_location TEXT,
    status TEXT DEFAULT 'active',
    contract_valid_until DATE,
    id_card_expiry_date DATE,
    passport_expiry_date DATE,
    notify_days_before_id_expiry INTEGER DEFAULT 100,
    notify_days_before_passport_expiry INTEGER DEFAULT 210,
    notify_days_before_contract_expiry INTEGER DEFAULT 30,
    notes TEXT,
    
    -- Personal Information
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    nationality TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    
    -- Contact Information
    email TEXT,
    phone TEXT,
    mobile_number TEXT,
    
    -- Document Information
    national_id TEXT,
    visa_number TEXT,
    visa_expiry_date DATE,
    work_permit_number TEXT,
    work_permit_expiry_date DATE,
    crn TEXT,
    
    -- Professional Information
    company TEXT,
    department TEXT,
    specialization TEXT,
    experience_years INTEGER,
    education_level TEXT,
    university TEXT,
    graduation_year INTEGER,
    skills TEXT,
    certifications TEXT,
    
    -- Financial Information
    bank_name TEXT,
    account_number TEXT,
    iban TEXT,
    swift_code TEXT,
    tax_id TEXT,
    
    -- Preferences
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    availability TEXT,
    preferred_language TEXT,
    timezone TEXT,
    special_requirements TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    contract_type TEXT NOT NULL CHECK (contract_type IN ('employment', 'service', 'consultancy', 'partnership')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'completed', 'terminated', 'expired')),
    start_date DATE,
    end_date DATE,
    value DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promoters_employer_id ON promoters(employer_id);
CREATE INDEX IF NOT EXISTS idx_promoters_outsourced_to_id ON promoters(outsourced_to_id);
CREATE INDEX IF NOT EXISTS idx_promoters_id_card_number ON promoters(id_card_number);
CREATE INDEX IF NOT EXISTS idx_promoters_status ON promoters(status);
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employer_id ON contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_promoters_updated_at BEFORE UPDATE ON promoters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO parties (name, type, email, phone) VALUES 
('Sample Company Ltd', 'company', 'info@samplecompany.com', '+1234567890')
ON CONFLICT DO NOTHING;

-- Create RLS policies for security
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these based on your needs)
CREATE POLICY "Enable read access for all users" ON promoters FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON promoters FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON promoters FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON promoters FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON contracts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON contracts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON contracts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON parties FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON parties FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON parties FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON parties FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE promoters IS 'Stores information about promoters/employees';
COMMENT ON TABLE contracts IS 'Stores contract information';
COMMENT ON TABLE parties IS 'Stores information about companies, individuals, and government entities';
COMMENT ON TABLE users IS 'Stores application users';
COMMENT ON TABLE audit_logs IS 'Stores audit trail for all data changes'; 