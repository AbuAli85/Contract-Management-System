-- Migration: Add missing tables for Contract Management System
-- Date: 2024-01-01
-- Description: Add missing tables for contracts, promoters, and related functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse dependency order to avoid foreign key issues
DROP TABLE IF EXISTS contract_amendments CASCADE;
DROP TABLE IF EXISTS contract_clauses CASCADE;
DROP TABLE IF EXISTS contract_templates CASCADE;
DROP TABLE IF EXISTS promoter_performance CASCADE;
DROP TABLE IF EXISTS promoter_availability CASCADE;
DROP TABLE IF EXISTS promoter_references CASCADE;
DROP TABLE IF EXISTS promoter_documents CASCADE;
DROP TABLE IF EXISTS promoter_education CASCADE;
DROP TABLE IF EXISTS promoter_experience CASCADE;
DROP TABLE IF EXISTS promoter_skills CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS promoters CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promoters table
CREATE TABLE IF NOT EXISTS promoters (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    nationality VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Address information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Professional information
    job_title VARCHAR(255),
    department VARCHAR(100),
    work_location VARCHAR(255),
    employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship')),
    
    -- Status and availability
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    availability VARCHAR(50) DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable', 'part_time')),
    overall_status VARCHAR(50) DEFAULT 'good' CHECK (overall_status IN ('excellent', 'good', 'fair', 'warning', 'critical')),
    
    -- Documents
    id_card_number VARCHAR(100),
    id_card_expiry_date DATE,
    passport_number VARCHAR(100),
    passport_expiry_date DATE,
    
    -- Additional information
    bio TEXT,
    notes TEXT,
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'service' CHECK (type IN ('employment', 'service', 'partnership', 'vendor', 'consulting', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'completed', 'terminated', 'expired')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Party relationships
    client_id UUID REFERENCES users(id),
    employer_id UUID REFERENCES users(id),
    promoter_id INTEGER REFERENCES promoters(id),
    
    -- Contract terms
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    renewal_terms TEXT,
    termination_clause TEXT,
    notice_period INTEGER DEFAULT 30,
    auto_renewal BOOLEAN DEFAULT FALSE,
    
    -- Financial terms
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_schedule VARCHAR(50) DEFAULT 'monthly' CHECK (payment_schedule IN ('monthly', 'quarterly', 'annually', 'milestone', 'upon_completion')),
    payment_terms TEXT,
    late_payment_penalty DECIMAL(15,2) DEFAULT 0,
    advance_payment DECIMAL(15,2) DEFAULT 0,
    
    -- Additional fields
    tags TEXT[],
    attachments TEXT[],
    notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (end_date > start_date),
    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Create promoter_skills table
CREATE TABLE IF NOT EXISTS promoter_skills (
    id SERIAL PRIMARY KEY,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency VARCHAR(50) NOT NULL DEFAULT 'intermediate' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_of_experience INTEGER,
    certification VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promoter_experience table
CREATE TABLE IF NOT EXISTS promoter_experience (
    id SERIAL PRIMARY KEY,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT[],
    skills_used TEXT[],
    location VARCHAR(255),
    industry VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promoter_education table
CREATE TABLE IF NOT EXISTS promoter_education (
    id SERIAL PRIMARY KEY,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    institution_name VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    gpa DECIMAL(3,2),
    honors VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promoter_documents table
CREATE TABLE IF NOT EXISTS promoter_documents (
    id SERIAL PRIMARY KEY,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('cv', 'id_card', 'passport', 'certificate', 'reference_letter', 'other')),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create promoter_references table
CREATE TABLE IF NOT EXISTS promoter_references (
    id SERIAL PRIMARY KEY,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    reference_name VARCHAR(255) NOT NULL,
    reference_title VARCHAR(255),
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    relationship VARCHAR(255),
    reference_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promoter_availability table
CREATE TABLE IF NOT EXISTS promoter_availability (
    id SERIAL PRIMARY KEY,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create promoter_performance table
CREATE TABLE IF NOT EXISTS promoter_performance (
    id SERIAL PRIMARY KEY,
    promoter_id INTEGER NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    contracts_completed INTEGER DEFAULT 0,
    contracts_cancelled INTEGER DEFAULT 0,
    total_earnings DECIMAL(15,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0,
    customer_satisfaction_score DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5),
    CONSTRAINT valid_delivery_rate CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
    CONSTRAINT valid_satisfaction_score CHECK (customer_satisfaction_score >= 0 AND customer_satisfaction_score <= 10)
);

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'service' CHECK (type IN ('employment', 'service', 'partnership', 'vendor', 'consulting', 'other')),
    content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contract_clauses table
CREATE TABLE IF NOT EXISTS contract_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'custom', 'regulatory', 'optional')),
    category VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (category IN ('payment', 'termination', 'liability', 'confidentiality', 'intellectual_property', 'other')),
    is_required BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    template_id UUID REFERENCES contract_templates(id)
);

-- Create contract_amendments table
CREATE TABLE IF NOT EXISTS contract_amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    changes TEXT NOT NULL,
    effective_date DATE NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employer_id ON contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);

CREATE INDEX IF NOT EXISTS idx_promoters_email ON promoters(email);
CREATE INDEX IF NOT EXISTS idx_promoters_status ON promoters(status);
CREATE INDEX IF NOT EXISTS idx_promoters_availability ON promoters(availability);
CREATE INDEX IF NOT EXISTS idx_promoters_overall_status ON promoters(overall_status);
CREATE INDEX IF NOT EXISTS idx_promoters_department ON promoters(department);
CREATE INDEX IF NOT EXISTS idx_promoters_work_location ON promoters(work_location);

CREATE INDEX IF NOT EXISTS idx_promoter_skills_promoter_id ON promoter_skills(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_skills_skill_name ON promoter_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_promoter_skills_proficiency ON promoter_skills(proficiency);

CREATE INDEX IF NOT EXISTS idx_promoter_experience_promoter_id ON promoter_experience(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_experience_company_name ON promoter_experience(company_name);
CREATE INDEX IF NOT EXISTS idx_promoter_experience_start_date ON promoter_experience(start_date);

CREATE INDEX IF NOT EXISTS idx_promoter_education_promoter_id ON promoter_education(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_education_institution_name ON promoter_education(institution_name);

CREATE INDEX IF NOT EXISTS idx_promoter_documents_promoter_id ON promoter_documents(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_documents_document_type ON promoter_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_active ON contract_templates(is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promoters_updated_at BEFORE UPDATE ON promoters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promoter_skills_updated_at BEFORE UPDATE ON promoter_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promoter_experience_updated_at BEFORE UPDATE ON promoter_experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promoter_education_updated_at BEFORE UPDATE ON promoter_education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default contract template
INSERT INTO contract_templates (id, name, description, type, content, variables, is_active) VALUES
(
    uuid_generate_v4(),
    'Standard Service Agreement',
    'A standard service agreement template for general business services',
    'service',
    'This Service Agreement (the "Agreement") is entered into as of [START_DATE] by and between [CLIENT_NAME] ("Client") and [EMPLOYER_NAME] ("Service Provider").

1. SERVICES
Service Provider shall provide the following services: [SERVICE_DESCRIPTION]

2. TERM
This Agreement shall commence on [START_DATE] and continue until [END_DATE], unless earlier terminated as provided herein.

3. COMPENSATION
Client shall pay Service Provider [AMOUNT] [CURRENCY] for the services provided, payable according to the following schedule: [PAYMENT_SCHEDULE]

4. TERMINATION
Either party may terminate this Agreement with [NOTICE_PERIOD] days written notice to the other party.

5. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of any proprietary information shared during the term of this Agreement.',
    ARRAY['START_DATE', 'CLIENT_NAME', 'EMPLOYER_NAME', 'SERVICE_DESCRIPTION', 'END_DATE', 'AMOUNT', 'CURRENCY', 'PAYMENT_SCHEDULE', 'NOTICE_PERIOD'],
    true
) ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create RLS policies for new tables
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these can be enhanced later)
CREATE POLICY "Users can view contracts" ON contracts FOR SELECT USING (true);
CREATE POLICY "Users can create contracts" ON contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own contracts" ON contracts FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view promoters" ON promoters FOR SELECT USING (true);
CREATE POLICY "Users can create promoters" ON promoters FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update promoters" ON promoters FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON TABLE contracts IS 'Stores contract information and metadata';
COMMENT ON TABLE promoters IS 'Stores promoter profile information';
COMMENT ON TABLE promoter_skills IS 'Stores promoter skills and proficiency levels';
COMMENT ON TABLE promoter_experience IS 'Stores promoter work experience history';
COMMENT ON TABLE promoter_education IS 'Stores promoter educational background';
COMMENT ON TABLE promoter_documents IS 'Stores promoter document files and metadata';
COMMENT ON TABLE promoter_references IS 'Stores promoter professional references';
COMMENT ON TABLE promoter_availability IS 'Stores promoter availability schedules';
COMMENT ON TABLE promoter_performance IS 'Stores promoter performance metrics';
COMMENT ON TABLE contract_templates IS 'Stores reusable contract templates';
COMMENT ON TABLE contract_clauses IS 'Stores contract clauses for templates';
COMMENT ON TABLE contract_amendments IS 'Stores contract amendments and changes';
COMMENT ON TABLE profiles IS 'Stores additional user profile information';
