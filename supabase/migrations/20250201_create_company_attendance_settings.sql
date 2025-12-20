-- Migration: Create Company Attendance Settings Table
-- Date: 2025-02-01
-- Description: Store company-specific attendance configuration settings

-- Create company_attendance_settings table
CREATE TABLE IF NOT EXISTS company_attendance_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Check-In Requirements
  require_photo BOOLEAN DEFAULT true,
  require_location BOOLEAN DEFAULT true,
  location_radius_meters INTEGER DEFAULT 50 CHECK (location_radius_meters >= 10 AND location_radius_meters <= 1000),
  check_in_time_window_minutes INTEGER DEFAULT 120 CHECK (check_in_time_window_minutes >= 30 AND check_in_time_window_minutes <= 480),
  
  -- Working Hours Configuration
  default_check_in_time TIME DEFAULT '09:00:00',
  default_check_out_time TIME DEFAULT '17:00:00',
  standard_work_hours DECIMAL(4,2) DEFAULT 8.0,
  overtime_threshold_hours DECIMAL(4,2) DEFAULT 8.0,
  overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
  
  -- Break Settings
  allow_breaks BOOLEAN DEFAULT true,
  max_break_duration_minutes INTEGER DEFAULT 60,
  max_breaks_per_day INTEGER DEFAULT 2,
  unpaid_break_minutes INTEGER DEFAULT 0, -- Breaks that don't count toward work hours
  
  -- Late/Absence Rules
  late_threshold_minutes INTEGER DEFAULT 15, -- Minutes after check-in time to be considered late
  absent_threshold_hours INTEGER DEFAULT 4, -- Hours after check-in time to be considered absent
  auto_mark_absent BOOLEAN DEFAULT false,
  auto_mark_absent_time TIME DEFAULT '12:00:00', -- Time to auto-mark absent if not checked in
  
  -- Approval Settings
  auto_approve BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT true,
  approval_deadline_hours INTEGER DEFAULT 24 CHECK (approval_deadline_hours >= 1 AND approval_deadline_hours <= 168),
  auto_approve_valid_checkins BOOLEAN DEFAULT false, -- Auto-approve if location verified and on time
  
  -- Link Settings
  default_link_validity_hours INTEGER DEFAULT 8 CHECK (default_link_validity_hours >= 1 AND default_link_validity_hours <= 24),
  max_uses_per_link INTEGER DEFAULT 1 CHECK (max_uses_per_link >= 1 AND max_uses_per_link <= 100),
  link_expiry_hours INTEGER DEFAULT 24 CHECK (link_expiry_hours >= 1 AND link_expiry_hours <= 168),
  
  -- Notification Settings
  send_check_in_reminders BOOLEAN DEFAULT true,
  reminder_time_minutes INTEGER DEFAULT 15 CHECK (reminder_time_minutes >= 5 AND reminder_time_minutes <= 120),
  send_check_out_reminders BOOLEAN DEFAULT false,
  send_approval_notifications BOOLEAN DEFAULT true,
  send_late_notifications BOOLEAN DEFAULT true,
  notification_methods TEXT[] DEFAULT ARRAY['email']::TEXT[] CHECK (notification_methods <@ ARRAY['email', 'sms', 'whatsapp', 'push']::TEXT[]),
  
  -- Report Settings
  default_report_format TEXT DEFAULT 'pdf' CHECK (default_report_format IN ('pdf', 'excel', 'csv')),
  include_photos_in_reports BOOLEAN DEFAULT false,
  include_location_in_reports BOOLEAN DEFAULT true,
  include_device_info_in_reports BOOLEAN DEFAULT false,
  auto_generate_reports BOOLEAN DEFAULT false,
  report_generation_schedule TEXT DEFAULT 'monthly' CHECK (report_generation_schedule IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'manual')),
  report_generation_day INTEGER DEFAULT 1, -- Day of month/week for scheduled reports (1-31 for monthly, 1-7 for weekly)
  
  -- Analytics Settings
  enable_analytics BOOLEAN DEFAULT true,
  analytics_retention_days INTEGER DEFAULT 365,
  track_overtime_trends BOOLEAN DEFAULT true,
  track_attendance_patterns BOOLEAN DEFAULT true,
  alert_on_anomalies BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Ensure one settings record per company
  CONSTRAINT company_attendance_settings_unique_company UNIQUE (company_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_attendance_settings_company_id ON company_attendance_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_attendance_settings_auto_approve ON company_attendance_settings(auto_approve);
CREATE INDEX IF NOT EXISTS idx_company_attendance_settings_auto_generate_reports ON company_attendance_settings(auto_generate_reports);

-- Enable RLS
ALTER TABLE company_attendance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Company owners and admins can view their company settings
CREATE POLICY "Company owners can view their attendance settings"
  ON company_attendance_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_attendance_settings.company_id
      AND c.owner_id = auth.uid()
    )
  );

-- Company owners and admins can insert settings
CREATE POLICY "Company owners can insert attendance settings"
  ON company_attendance_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_attendance_settings.company_id
      AND c.owner_id = auth.uid()
    )
  );

-- Company owners and admins can update their settings
CREATE POLICY "Company owners can update their attendance settings"
  ON company_attendance_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_attendance_settings.company_id
      AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_attendance_settings.company_id
      AND c.owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_attendance_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_company_attendance_settings_updated_at
  BEFORE UPDATE ON company_attendance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_attendance_settings_updated_at();

-- Function to get company attendance settings with defaults
CREATE OR REPLACE FUNCTION get_company_attendance_settings(p_company_id UUID)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  require_photo BOOLEAN,
  require_location BOOLEAN,
  location_radius_meters INTEGER,
  check_in_time_window_minutes INTEGER,
  default_check_in_time TIME,
  default_check_out_time TIME,
  standard_work_hours DECIMAL,
  overtime_threshold_hours DECIMAL,
  overtime_rate_multiplier DECIMAL,
  allow_breaks BOOLEAN,
  max_break_duration_minutes INTEGER,
  max_breaks_per_day INTEGER,
  unpaid_break_minutes INTEGER,
  late_threshold_minutes INTEGER,
  absent_threshold_hours INTEGER,
  auto_mark_absent BOOLEAN,
  auto_mark_absent_time TIME,
  auto_approve BOOLEAN,
  require_approval BOOLEAN,
  approval_deadline_hours INTEGER,
  auto_approve_valid_checkins BOOLEAN,
  default_link_validity_hours INTEGER,
  max_uses_per_link INTEGER,
  link_expiry_hours INTEGER,
  send_check_in_reminders BOOLEAN,
  reminder_time_minutes INTEGER,
  send_check_out_reminders BOOLEAN,
  send_approval_notifications BOOLEAN,
  send_late_notifications BOOLEAN,
  notification_methods TEXT[],
  default_report_format TEXT,
  include_photos_in_reports BOOLEAN,
  include_location_in_reports BOOLEAN,
  include_device_info_in_reports BOOLEAN,
  auto_generate_reports BOOLEAN,
  report_generation_schedule TEXT,
  report_generation_day INTEGER,
  enable_analytics BOOLEAN,
  analytics_retention_days INTEGER,
  track_overtime_trends BOOLEAN,
  track_attendance_patterns BOOLEAN,
  alert_on_anomalies BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.company_id,
    COALESCE(s.require_photo, true),
    COALESCE(s.require_location, true),
    COALESCE(s.location_radius_meters, 50),
    COALESCE(s.check_in_time_window_minutes, 120),
    COALESCE(s.default_check_in_time, '09:00:00'::TIME),
    COALESCE(s.default_check_out_time, '17:00:00'::TIME),
    COALESCE(s.standard_work_hours, 8.0),
    COALESCE(s.overtime_threshold_hours, 8.0),
    COALESCE(s.overtime_rate_multiplier, 1.5),
    COALESCE(s.allow_breaks, true),
    COALESCE(s.max_break_duration_minutes, 60),
    COALESCE(s.max_breaks_per_day, 2),
    COALESCE(s.unpaid_break_minutes, 0),
    COALESCE(s.late_threshold_minutes, 15),
    COALESCE(s.absent_threshold_hours, 4),
    COALESCE(s.auto_mark_absent, false),
    COALESCE(s.auto_mark_absent_time, '12:00:00'::TIME),
    COALESCE(s.auto_approve, false),
    COALESCE(s.require_approval, true),
    COALESCE(s.approval_deadline_hours, 24),
    COALESCE(s.auto_approve_valid_checkins, false),
    COALESCE(s.default_link_validity_hours, 8),
    COALESCE(s.max_uses_per_link, 1),
    COALESCE(s.link_expiry_hours, 24),
    COALESCE(s.send_check_in_reminders, true),
    COALESCE(s.reminder_time_minutes, 15),
    COALESCE(s.send_check_out_reminders, false),
    COALESCE(s.send_approval_notifications, true),
    COALESCE(s.send_late_notifications, true),
    COALESCE(s.notification_methods, ARRAY['email']::TEXT[]),
    COALESCE(s.default_report_format, 'pdf'),
    COALESCE(s.include_photos_in_reports, false),
    COALESCE(s.include_location_in_reports, true),
    COALESCE(s.include_device_info_in_reports, false),
    COALESCE(s.auto_generate_reports, false),
    COALESCE(s.report_generation_schedule, 'monthly'),
    COALESCE(s.report_generation_day, 1),
    COALESCE(s.enable_analytics, true),
    COALESCE(s.analytics_retention_days, 365),
    COALESCE(s.track_overtime_trends, true),
    COALESCE(s.track_attendance_patterns, true),
    COALESCE(s.alert_on_anomalies, true),
    s.created_at,
    s.updated_at
  FROM company_attendance_settings s
  WHERE s.company_id = p_company_id
  
  UNION ALL
  
  -- Return defaults if no settings exist
  SELECT 
    NULL::UUID,
    p_company_id,
    true, -- require_photo
    true, -- require_location
    50, -- location_radius_meters
    120, -- check_in_time_window_minutes
    '09:00:00'::TIME, -- default_check_in_time
    '17:00:00'::TIME, -- default_check_out_time
    8.0, -- standard_work_hours
    8.0, -- overtime_threshold_hours
    1.5, -- overtime_rate_multiplier
    true, -- allow_breaks
    60, -- max_break_duration_minutes
    2, -- max_breaks_per_day
    0, -- unpaid_break_minutes
    15, -- late_threshold_minutes
    4, -- absent_threshold_hours
    false, -- auto_mark_absent
    '12:00:00'::TIME, -- auto_mark_absent_time
    false, -- auto_approve
    true, -- require_approval
    24, -- approval_deadline_hours
    false, -- auto_approve_valid_checkins
    8, -- default_link_validity_hours
    1, -- max_uses_per_link
    24, -- link_expiry_hours
    true, -- send_check_in_reminders
    15, -- reminder_time_minutes
    false, -- send_check_out_reminders
    true, -- send_approval_notifications
    true, -- send_late_notifications
    ARRAY['email']::TEXT[], -- notification_methods
    'pdf', -- default_report_format
    false, -- include_photos_in_reports
    true, -- include_location_in_reports
    false, -- include_device_info_in_reports
    false, -- auto_generate_reports
    'monthly', -- report_generation_schedule
    1, -- report_generation_day
    true, -- enable_analytics
    365, -- analytics_retention_days
    true, -- track_overtime_trends
    true, -- track_attendance_patterns
    true, -- alert_on_anomalies
    NOW(), -- created_at
    NOW() -- updated_at
  WHERE NOT EXISTS (
    SELECT 1 FROM company_attendance_settings WHERE company_id = p_company_id
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE company_attendance_settings IS 'Company-specific attendance configuration settings';
COMMENT ON COLUMN company_attendance_settings.location_radius_meters IS 'Allowed distance from office location in meters (10-1000)';
COMMENT ON COLUMN company_attendance_settings.check_in_time_window_minutes IS 'Time window after scheduled check-in time when employees can still check in (30-480 minutes)';
COMMENT ON COLUMN company_attendance_settings.late_threshold_minutes IS 'Minutes after default check-in time to be considered late';
COMMENT ON COLUMN company_attendance_settings.absent_threshold_hours IS 'Hours after check-in time to auto-mark as absent';
COMMENT ON COLUMN company_attendance_settings.overtime_rate_multiplier IS 'Multiplier for overtime pay calculation (e.g., 1.5 for time-and-a-half)';

