-- ============================================================
-- Promoter Module Tables Migration
-- Created: 2026-02-27
-- Purpose: Add all tables required by the promoter module
-- ============================================================

-- Promoter Notes
CREATE TABLE IF NOT EXISTS promoter_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'performance', 'compliance', 'communication', 'financial')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE promoter_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promoter_notes_auth" ON promoter_notes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_promoter_notes_promoter_id ON promoter_notes(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_notes_created_at ON promoter_notes(created_at DESC);

-- Promoter Tags
CREATE TABLE IF NOT EXISTS promoter_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promoter_id, tag)
);

ALTER TABLE promoter_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promoter_tags_auth" ON promoter_tags FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_promoter_tags_promoter_id ON promoter_tags(promoter_id);

-- Promoter Attendance Logs
CREATE TABLE IF NOT EXISTS promoter_attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE(promoter_id, date)
);

ALTER TABLE promoter_attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promoter_attendance_auth" ON promoter_attendance_logs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_promoter_attendance_promoter_id ON promoter_attendance_logs(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_attendance_date ON promoter_attendance_logs(date DESC);

-- Promoter Feedback
CREATE TABLE IF NOT EXISTS promoter_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT NOT NULL DEFAULT 'general' CHECK (feedback_type IN ('general', 'performance', 'behavior', 'skills', 'communication')),
  given_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE promoter_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promoter_feedback_auth" ON promoter_feedback FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_promoter_feedback_promoter_id ON promoter_feedback(promoter_id);

-- Promoter Leave Requests
CREATE TABLE IF NOT EXISTS promoter_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

ALTER TABLE promoter_leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promoter_leave_auth" ON promoter_leave_requests FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_promoter_leave_promoter_id ON promoter_leave_requests(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_leave_status ON promoter_leave_requests(status);

-- Promoter Performance Metrics
CREATE TABLE IF NOT EXISTS promoter_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT 'month' CHECK (period IN ('week', 'month', 'quarter', 'year')),
  contracts_count INTEGER NOT NULL DEFAULT 0,
  active_contracts INTEGER NOT NULL DEFAULT 0,
  completed_contracts INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  performance_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (performance_score BETWEEN 0 AND 100),
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promoter_id, period)
);

ALTER TABLE promoter_performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promoter_perf_metrics_auth" ON promoter_performance_metrics FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_promoter_perf_metrics_promoter_id ON promoter_performance_metrics(promoter_id);

-- Promoter Badges
CREATE TABLE IF NOT EXISTS promoter_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES auth.users(id),
  UNIQUE(promoter_id, badge_type)
);

ALTER TABLE promoter_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promoter_badges_auth" ON promoter_badges FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_promoter_badges_promoter_id ON promoter_badges(promoter_id);

-- Add missing indexes to promoters table for performance
CREATE INDEX IF NOT EXISTS idx_promoters_status ON promoters(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promoters_employer_id ON promoters(employer_id) WHERE employer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promoters_nationality ON promoters(nationality) WHERE nationality IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promoters_created_at ON promoters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promoters_name_en ON promoters(name_en);
