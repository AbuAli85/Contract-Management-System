-- Attendance Logs
CREATE TABLE IF NOT EXISTS promoter_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    status TEXT DEFAULT 'present', -- present, absent, late, half-day, etc.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(promoter_id, date)
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS promoter_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL, -- sick, vacation, personal, other
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Settings (for each promoter)
CREATE TABLE IF NOT EXISTS promoter_attendance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE UNIQUE,
    work_schedule JSONB, -- {"monday": {"start": "09:00", "end": "17:00"}, ...}
    timezone TEXT DEFAULT 'UTC',
    auto_checkout_hours INTEGER DEFAULT 8,
    late_threshold_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_logs_promoter_date ON promoter_attendance_logs(promoter_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON promoter_attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_promoter ON promoter_leave_requests(promoter_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON promoter_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON promoter_leave_requests(start_date, end_date);

-- Add RLS policies
ALTER TABLE promoter_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_attendance_settings ENABLE ROW LEVEL SECURITY;

-- Policies for attendance logs
CREATE POLICY "Users can view their own attendance logs" ON promoter_attendance_logs
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all attendance logs" ON promoter_attendance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert attendance logs" ON promoter_attendance_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update attendance logs" ON promoter_attendance_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for leave requests
CREATE POLICY "Users can view their own leave requests" ON promoter_leave_requests
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all leave requests" ON promoter_leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can insert their own leave requests" ON promoter_leave_requests
    FOR INSERT WITH CHECK (auth.uid() = promoter_id);

CREATE POLICY "Admins can update leave requests" ON promoter_leave_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for attendance settings
CREATE POLICY "Users can view their own attendance settings" ON promoter_attendance_settings
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all attendance settings" ON promoter_attendance_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert attendance settings" ON promoter_attendance_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update attendance settings" ON promoter_attendance_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ); 