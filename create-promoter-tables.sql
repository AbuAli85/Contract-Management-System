-- Create Missing Promoter Tables
-- Run this in Supabase SQL Editor to fix the "promoter_tags" relationship error

-- Promoter Tags (simple version)
CREATE TABLE IF NOT EXISTS promoter_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_tags_promoter ON promoter_tags(promoter_id);

-- Promoter Skills
CREATE TABLE IF NOT EXISTS promoter_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    level TEXT,
    years_experience INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_skills_promoter ON promoter_skills(promoter_id);

-- Promoter Experience
CREATE TABLE IF NOT EXISTS promoter_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    position TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_experience_promoter ON promoter_experience(promoter_id);

-- Promoter Education
CREATE TABLE IF NOT EXISTS promoter_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_education_promoter ON promoter_education(promoter_id);

-- Promoter Documents
CREATE TABLE IF NOT EXISTS promoter_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);
CREATE INDEX IF NOT EXISTS idx_promoter_documents_promoter ON promoter_documents(promoter_id);

-- Enable RLS on all tables
ALTER TABLE promoter_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for promoter_tags
CREATE POLICY "Users can view promoter tags" ON promoter_tags
    FOR SELECT USING (true);

CREATE POLICY "Users can manage promoter tags" ON promoter_tags
    FOR ALL USING (true);

-- Create RLS policies for promoter_skills
CREATE POLICY "Users can view promoter skills" ON promoter_skills
    FOR SELECT USING (true);

CREATE POLICY "Users can manage promoter skills" ON promoter_skills
    FOR ALL USING (true);

-- Create RLS policies for promoter_experience
CREATE POLICY "Users can view promoter experience" ON promoter_experience
    FOR SELECT USING (true);

CREATE POLICY "Users can manage promoter experience" ON promoter_experience
    FOR ALL USING (true);

-- Create RLS policies for promoter_education
CREATE POLICY "Users can view promoter education" ON promoter_education
    FOR SELECT USING (true);

CREATE POLICY "Users can manage promoter education" ON promoter_education
    FOR ALL USING (true);

-- Create RLS policies for promoter_documents
CREATE POLICY "Users can view promoter documents" ON promoter_documents
    FOR SELECT USING (true);

CREATE POLICY "Users can manage promoter documents" ON promoter_documents
    FOR ALL USING (true);

-- Verify tables were created
SELECT 'promoter_tags' as table_name, COUNT(*) as record_count FROM promoter_tags
UNION ALL
SELECT 'promoter_skills' as table_name, COUNT(*) as record_count FROM promoter_skills
UNION ALL
SELECT 'promoter_experience' as table_name, COUNT(*) as record_count FROM promoter_experience
UNION ALL
SELECT 'promoter_education' as table_name, COUNT(*) as record_count FROM promoter_education
UNION ALL
SELECT 'promoter_documents' as table_name, COUNT(*) as record_count FROM promoter_documents;

-- Show success message
SELECT '=== PROMOTER TABLES CREATED SUCCESSFULLY ===' as status; 