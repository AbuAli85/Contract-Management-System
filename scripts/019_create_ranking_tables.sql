-- Promoter Scores
CREATE TABLE IF NOT EXISTS promoter_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    score_type TEXT NOT NULL, -- overall, attendance, performance, quality, etc.
    score_value DECIMAL(10,2) NOT NULL,
    max_score DECIMAL(10,2) DEFAULT 100,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges and Achievements
CREATE TABLE IF NOT EXISTS promoter_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL, -- attendance_streak, performance_excellence, etc.
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT, -- URL to badge icon
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback and Reviews
CREATE TABLE IF NOT EXISTS promoter_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id),
    feedback_type TEXT NOT NULL, -- performance_review, peer_feedback, client_feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    strengths TEXT[],
    areas_for_improvement TEXT[],
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS promoter_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type TEXT NOT NULL, -- monthly, quarterly, yearly, all_time
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    leaderboard_data JSONB, -- Store ranking data as JSON
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement Rules
CREATE TABLE IF NOT EXISTS achievement_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    badge_type TEXT NOT NULL,
    criteria JSONB, -- Store achievement criteria as JSON
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score History
CREATE TABLE IF NOT EXISTS promoter_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    score_type TEXT NOT NULL,
    old_score DECIMAL(10,2),
    new_score DECIMAL(10,2),
    change_reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promoter_scores_promoter ON promoter_scores(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_scores_type ON promoter_scores(score_type);
CREATE INDEX IF NOT EXISTS idx_promoter_scores_period ON promoter_scores(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_promoter_badges_promoter ON promoter_badges(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_badges_type ON promoter_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_promoter_feedback_promoter ON promoter_feedback(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_feedback_type ON promoter_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_promoter_feedback_rating ON promoter_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON promoter_leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON promoter_leaderboards(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_score_history_promoter ON promoter_score_history(promoter_id);

-- Add RLS policies
ALTER TABLE promoter_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_score_history ENABLE ROW LEVEL SECURITY;

-- Policies for promoter scores
CREATE POLICY "Users can view their own scores" ON promoter_scores
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all scores" ON promoter_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage scores" ON promoter_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for badges
CREATE POLICY "Users can view their own badges" ON promoter_badges
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all badges" ON promoter_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage badges" ON promoter_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for feedback
CREATE POLICY "Users can view their own feedback" ON promoter_feedback
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all feedback" ON promoter_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create feedback" ON promoter_feedback
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Admins can manage feedback" ON promoter_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for leaderboards
CREATE POLICY "Everyone can view leaderboards" ON promoter_leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage leaderboards" ON promoter_leaderboards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for achievement rules
CREATE POLICY "Admins can manage achievement rules" ON achievement_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for score history
CREATE POLICY "Users can view their own score history" ON promoter_score_history
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all score history" ON promoter_score_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ); 