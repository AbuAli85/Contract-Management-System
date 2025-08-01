-- Create All Missing Promoter Tables
-- Run this in Supabase SQL Editor to fix all promoter-related errors

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

-- Promoter Badges (for ranking system)
CREATE TABLE IF NOT EXISTS promoter_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT,
    is_active BOOLEAN DEFAULT true,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_badges_promoter ON promoter_badges(promoter_id);

-- Promoter Scores (for ranking system)
CREATE TABLE IF NOT EXISTS promoter_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    score_type TEXT NOT NULL,
    score_value DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100,
    period_start DATE,
    period_end DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_scores_promoter ON promoter_scores(promoter_id);

-- Promoter Feedback (for ranking system)
CREATE TABLE IF NOT EXISTS promoter_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_feedback_promoter ON promoter_feedback(promoter_id);

-- Promoter Performance Metrics
CREATE TABLE IF NOT EXISTS promoter_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,2),
    metric_unit TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_performance_metrics_promoter ON promoter_performance_metrics(promoter_id);

-- Promoter Tasks
CREATE TABLE IF NOT EXISTS promoter_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    task_description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_tasks_promoter ON promoter_tasks(promoter_id);

-- Promoter Notes
CREATE TABLE IF NOT EXISTS promoter_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    note_title TEXT NOT NULL,
    note_content TEXT NOT NULL,
    note_type TEXT DEFAULT 'general',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_notes_promoter ON promoter_notes(promoter_id);

-- Promoter Leave Requests
CREATE TABLE IF NOT EXISTS promoter_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_leave_requests_promoter ON promoter_leave_requests(promoter_id);

-- Promoter Communications
CREATE TABLE IF NOT EXISTS promoter_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    communication_type TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_communications_promoter ON promoter_communications(promoter_id);

-- Promoter Attendance
CREATE TABLE IF NOT EXISTS promoter_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_attendance_promoter ON promoter_attendance(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_attendance_date ON promoter_attendance(date);

-- Promoter Reports
CREATE TABLE IF NOT EXISTS promoter_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    report_title TEXT NOT NULL,
    report_content TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promoter_reports_promoter ON promoter_reports(promoter_id);

-- Enable RLS on all tables
ALTER TABLE promoter_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables (permissive for now)
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'promoter_tags', 'promoter_skills', 'promoter_experience', 'promoter_education',
            'promoter_documents', 'promoter_badges', 'promoter_scores', 'promoter_feedback',
            'promoter_performance_metrics', 'promoter_tasks', 'promoter_notes',
            'promoter_leave_requests', 'promoter_communications', 'promoter_attendance',
            'promoter_reports'
        ])
    LOOP
        EXECUTE format('CREATE POLICY "Users can view %I" ON %I FOR SELECT USING (true)', table_name, table_name);
        EXECUTE format('CREATE POLICY "Users can manage %I" ON %I FOR ALL USING (true)', table_name, table_name);
    END LOOP;
END $$;

-- Verify tables were created
SELECT 'promoter_tags' as table_name, COUNT(*) as record_count FROM promoter_tags
UNION ALL
SELECT 'promoter_skills' as table_name, COUNT(*) as record_count FROM promoter_skills
UNION ALL
SELECT 'promoter_experience' as table_name, COUNT(*) as record_count FROM promoter_experience
UNION ALL
SELECT 'promoter_education' as table_name, COUNT(*) as record_count FROM promoter_education
UNION ALL
SELECT 'promoter_documents' as table_name, COUNT(*) as record_count FROM promoter_documents
UNION ALL
SELECT 'promoter_badges' as table_name, COUNT(*) as record_count FROM promoter_badges
UNION ALL
SELECT 'promoter_scores' as table_name, COUNT(*) as record_count FROM promoter_scores
UNION ALL
SELECT 'promoter_feedback' as table_name, COUNT(*) as record_count FROM promoter_feedback
UNION ALL
SELECT 'promoter_performance_metrics' as table_name, COUNT(*) as record_count FROM promoter_performance_metrics
UNION ALL
SELECT 'promoter_tasks' as table_name, COUNT(*) as record_count FROM promoter_tasks
UNION ALL
SELECT 'promoter_notes' as table_name, COUNT(*) as record_count FROM promoter_notes
UNION ALL
SELECT 'promoter_leave_requests' as table_name, COUNT(*) as record_count FROM promoter_leave_requests
UNION ALL
SELECT 'promoter_communications' as table_name, COUNT(*) as record_count FROM promoter_communications
UNION ALL
SELECT 'promoter_attendance' as table_name, COUNT(*) as record_count FROM promoter_attendance
UNION ALL
SELECT 'promoter_reports' as table_name, COUNT(*) as record_count FROM promoter_reports;

-- Show success message
SELECT '=== ALL PROMOTER TABLES CREATED SUCCESSFULLY ===' as status; 