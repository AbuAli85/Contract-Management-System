-- Promoter Skills
CREATE TABLE IF NOT EXISTS promoter_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    level TEXT, -- e.g., Beginner, Intermediate, Expert
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoter Experience
CREATE TABLE IF NOT EXISTS promoter_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoter Education
CREATE TABLE IF NOT EXISTS promoter_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    degree TEXT NOT NULL,
    institution TEXT NOT NULL,
    year INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoter Documents (CV, certificates, etc.)
CREATE TABLE IF NOT EXISTS promoter_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., CV, Certificate
    url TEXT NOT NULL,
    description TEXT,
    uploaded_on TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1
); 