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