-- Performance Metrics
CREATE TABLE IF NOT EXISTS promoter_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- attendance_rate, contract_completion, response_time, etc.
    value DECIMAL(10,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    target_value DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL, -- performance, attendance, contract, custom
    query_template TEXT, -- SQL template or query structure
    parameters JSONB, -- Template parameters
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES report_templates(id),
    promoter_id UUID REFERENCES promoters(id),
    report_name TEXT NOT NULL,
    report_data JSONB, -- Actual report data
    file_url TEXT, -- URL to generated PDF/Excel file
    generated_by UUID REFERENCES profiles(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    parameters JSONB -- Parameters used for generation
);

-- Report Schedule
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES report_templates(id),
    promoter_id UUID REFERENCES promoters(id),
    schedule_type TEXT NOT NULL, -- daily, weekly, monthly, quarterly
    schedule_config JSONB, -- Cron-like configuration
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_promoter ON promoter_performance_metrics(promoter_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON promoter_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON promoter_performance_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_generated_reports_promoter ON generated_reports(promoter_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_template ON generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_date ON generated_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_promoter ON report_schedules(promoter_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);

-- Add RLS policies
ALTER TABLE promoter_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for performance metrics
CREATE POLICY "Users can view their own performance metrics" ON promoter_performance_metrics
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all performance metrics" ON promoter_performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert performance metrics" ON promoter_performance_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for report templates
CREATE POLICY "Admins can manage report templates" ON report_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for generated reports
CREATE POLICY "Users can view their own reports" ON generated_reports
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can view all reports" ON generated_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can generate reports" ON generated_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policies for report schedules
CREATE POLICY "Users can view their own schedules" ON report_schedules
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Admins can manage all schedules" ON report_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ); 