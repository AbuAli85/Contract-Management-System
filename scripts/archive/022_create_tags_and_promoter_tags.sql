-- Tags table (reusable tags)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoter_Tags join table (many-to-many)
CREATE TABLE IF NOT EXISTS promoter_tags (
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (promoter_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_promoter_tags_promoter ON promoter_tags(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_tags_tag ON promoter_tags(tag_id); 