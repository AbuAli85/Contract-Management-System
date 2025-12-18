-- Migration: Create Automated Attendance Link Schedules
-- Date: 2025-01-12
-- Description: Automated daily attendance link generation and distribution system

-- Table for automated attendance link schedules
CREATE TABLE IF NOT EXISTS attendance_link_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Schedule Configuration
  name VARCHAR(255) NOT NULL, -- e.g., "Daily Office Check-In"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Location Settings
  office_location_id UUID REFERENCES office_locations(id) ON DELETE SET NULL,
  target_latitude DECIMAL(10, 8), -- Custom location if not using office_location
  target_longitude DECIMAL(11, 8),
  allowed_radius_meters INTEGER DEFAULT 50,
  
  -- Time Settings
  check_in_time TIME NOT NULL, -- e.g., '09:00:00'
  check_out_time TIME, -- Optional check-out time, e.g., '17:00:00'
  link_valid_duration_hours INTEGER DEFAULT 2, -- How long the link is valid (default 2 hours)
  
  -- Schedule Days
  monday BOOLEAN DEFAULT true,
  tuesday BOOLEAN DEFAULT true,
  wednesday BOOLEAN DEFAULT true,
  thursday BOOLEAN DEFAULT true,
  friday BOOLEAN DEFAULT true,
  saturday BOOLEAN DEFAULT false,
  sunday BOOLEAN DEFAULT false,
  
  -- Notification Settings
  send_check_in_link BOOLEAN DEFAULT true,
  send_check_out_link BOOLEAN DEFAULT false,
  notification_method TEXT[] DEFAULT ARRAY['email'], -- ['email', 'sms', 'both']
  send_before_minutes INTEGER DEFAULT 15, -- Send link 15 minutes before check-in time
  
  -- Employee Targeting
  send_to_all_employees BOOLEAN DEFAULT true,
  specific_employee_ids UUID[], -- If not all, specify employee IDs
  specific_team_ids UUID[], -- Target specific teams (if teams table exists)
  
  -- Advanced Settings
  max_uses_per_link INTEGER, -- Max check-ins per link (NULL = unlimited)
  require_photo BOOLEAN DEFAULT true,
  require_location_verification BOOLEAN DEFAULT true,
  
  -- Metadata
  last_generated_at TIMESTAMPTZ, -- Last time links were generated
  last_sent_at TIMESTAMPTZ, -- Last time notifications were sent
  next_generation_date DATE, -- Next date links will be generated
  total_links_generated INTEGER DEFAULT 0,
  total_notifications_sent INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_company_id ON attendance_link_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_is_active ON attendance_link_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_next_generation ON attendance_link_schedules(next_generation_date);
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_created_by ON attendance_link_schedules(created_by);

-- Table to track generated links from schedules
CREATE TABLE IF NOT EXISTS scheduled_attendance_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES attendance_link_schedules(id) ON DELETE CASCADE NOT NULL,
  attendance_link_id UUID REFERENCES attendance_links(id) ON DELETE CASCADE NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('check_in', 'check_out')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  notifications_sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_links_schedule_id ON scheduled_attendance_links(schedule_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_links_date ON scheduled_attendance_links(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_links_link_id ON scheduled_attendance_links(attendance_link_id);

-- Function to check if schedule should run today
CREATE OR REPLACE FUNCTION should_schedule_run_today(schedule attendance_link_schedules)
RETURNS BOOLEAN AS $$
DECLARE
  day_of_week INTEGER;
BEGIN
  day_of_week := EXTRACT(DOW FROM CURRENT_DATE);
  
  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  CASE day_of_week
    WHEN 0 THEN RETURN schedule.sunday;
    WHEN 1 THEN RETURN schedule.monday;
    WHEN 2 THEN RETURN schedule.tuesday;
    WHEN 3 THEN RETURN schedule.wednesday;
    WHEN 4 THEN RETURN schedule.thursday;
    WHEN 5 THEN RETURN schedule.friday;
    WHEN 6 THEN RETURN schedule.saturday;
    ELSE RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate links for a schedule
CREATE OR REPLACE FUNCTION generate_schedule_links(p_schedule_id UUID)
RETURNS TABLE(
  check_in_link_id UUID,
  check_out_link_id UUID
) AS $$
DECLARE
  v_schedule attendance_link_schedules;
  v_company_id UUID;
  v_created_by UUID;
  v_latitude DECIMAL(10, 8);
  v_longitude DECIMAL(11, 8);
  v_radius INTEGER;
  v_check_in_link_id UUID;
  v_check_out_link_id UUID;
  v_check_in_code VARCHAR(50);
  v_check_out_code VARCHAR(50);
  v_valid_from TIMESTAMPTZ;
  v_valid_until TIMESTAMPTZ;
  v_title TEXT;
BEGIN
  -- Get schedule details
  SELECT * INTO v_schedule
  FROM attendance_link_schedules
  WHERE id = p_schedule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found or inactive';
  END IF;
  
  -- Check if should run today
  IF NOT should_schedule_run_today(v_schedule) THEN
    RETURN;
  END IF;
  
  -- Check if already generated for today
  IF EXISTS (
    SELECT 1 FROM scheduled_attendance_links
    WHERE schedule_id = p_schedule_id
      AND scheduled_date = CURRENT_DATE
  ) THEN
    RETURN;
  END IF;
  
  v_company_id := v_schedule.company_id;
  v_created_by := v_schedule.created_by;
  
  -- Get location coordinates
  IF v_schedule.office_location_id IS NOT NULL THEN
    SELECT latitude, longitude, radius_meters
    INTO v_latitude, v_longitude, v_radius
    FROM office_locations
    WHERE id = v_schedule.office_location_id;
  ELSE
    v_latitude := v_schedule.target_latitude;
    v_longitude := v_schedule.target_longitude;
    v_radius := v_schedule.allowed_radius_meters;
  END IF;
  
  IF v_latitude IS NULL OR v_longitude IS NULL THEN
    RAISE EXCEPTION 'Location not configured for schedule';
  END IF;
  
  -- Generate check-in link
  IF v_schedule.send_check_in_link THEN
    v_check_in_code := generate_attendance_link_code();
    v_valid_from := (CURRENT_DATE + v_schedule.check_in_time) - (v_schedule.send_before_minutes || 0 || INTERVAL '1 minute');
    v_valid_until := (CURRENT_DATE + v_schedule.check_in_time) + (v_schedule.link_valid_duration_hours || 2 || INTERVAL '1 hour');
    v_title := COALESCE(v_schedule.name, 'Daily Check-In') || ' - ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
    
    INSERT INTO attendance_links (
      company_id,
      created_by,
      link_code,
      title,
      target_latitude,
      target_longitude,
      allowed_radius_meters,
      valid_from,
      valid_until,
      max_uses,
      is_active,
      office_location_id
    ) VALUES (
      v_company_id,
      v_created_by,
      v_check_in_code,
      v_title || ' (Check-In)',
      v_latitude,
      v_longitude,
      v_radius,
      v_valid_from,
      v_valid_until,
      v_schedule.max_uses_per_link,
      true,
      v_schedule.office_location_id
    ) RETURNING id INTO v_check_in_link_id;
    
    -- Record in scheduled_attendance_links
    INSERT INTO scheduled_attendance_links (
      schedule_id,
      attendance_link_id,
      link_type,
      scheduled_date,
      scheduled_time
    ) VALUES (
      p_schedule_id,
      v_check_in_link_id,
      'check_in',
      CURRENT_DATE,
      v_schedule.check_in_time
    );
  END IF;
  
  -- Generate check-out link if configured
  IF v_schedule.send_check_out_link AND v_schedule.check_out_time IS NOT NULL THEN
    v_check_out_code := generate_attendance_link_code();
    v_valid_from := (CURRENT_DATE + v_schedule.check_out_time) - (v_schedule.send_before_minutes || 0 || INTERVAL '1 minute');
    v_valid_until := (CURRENT_DATE + v_schedule.check_out_time) + (v_schedule.link_valid_duration_hours || 2 || INTERVAL '1 hour');
    
    INSERT INTO attendance_links (
      company_id,
      created_by,
      link_code,
      title,
      target_latitude,
      target_longitude,
      allowed_radius_meters,
      valid_from,
      valid_until,
      max_uses,
      is_active,
      office_location_id
    ) VALUES (
      v_company_id,
      v_created_by,
      v_check_out_code,
      COALESCE(v_schedule.name, 'Daily Check-Out') || ' - ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') || ' (Check-Out)',
      v_latitude,
      v_longitude,
      v_radius,
      v_valid_from,
      v_valid_until,
      v_schedule.max_uses_per_link,
      true,
      v_schedule.office_location_id
    ) RETURNING id INTO v_check_out_link_id;
    
    -- Record in scheduled_attendance_links
    INSERT INTO scheduled_attendance_links (
      schedule_id,
      attendance_link_id,
      link_type,
      scheduled_date,
      scheduled_time
    ) VALUES (
      p_schedule_id,
      v_check_out_link_id,
      'check_out',
      CURRENT_DATE,
      v_schedule.check_out_time
    );
  END IF;
  
  -- Update schedule metadata
  UPDATE attendance_link_schedules
  SET 
    last_generated_at = NOW(),
    next_generation_date = CURRENT_DATE + INTERVAL '1 day',
    total_links_generated = total_links_generated + 
      CASE WHEN v_check_in_link_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN v_check_out_link_id IS NOT NULL THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_schedule_id;
  
  RETURN QUERY SELECT v_check_in_link_id, v_check_out_link_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get employees for a schedule (legacy - kept for backward compatibility)
CREATE OR REPLACE FUNCTION get_schedule_employees(p_schedule_id UUID)
RETURNS TABLE(
  employee_id UUID,
  email TEXT,
  phone TEXT,
  full_name TEXT
) AS $$
DECLARE
  v_schedule attendance_link_schedules;
BEGIN
  SELECT * INTO v_schedule
  FROM attendance_link_schedules
  WHERE id = p_schedule_id;
  
  -- Use enhanced function if assignment_type is set, otherwise use legacy logic
  IF v_schedule.assignment_type IS NOT NULL AND v_schedule.assignment_type != 'all' THEN
    RETURN QUERY
    SELECT 
      employee_id,
      email,
      phone,
      full_name
    FROM get_schedule_employees_enhanced(p_schedule_id);
  ELSIF v_schedule.send_to_all_employees OR v_schedule.assignment_type = 'all' OR v_schedule.assignment_type IS NULL THEN
    RETURN QUERY
    SELECT 
      ee.id,
      p.email,
      p.phone,
      p.full_name
    FROM employer_employees ee
    JOIN profiles p ON p.id = ee.employee_id
    WHERE (
      ee.company_id = v_schedule.company_id
      OR EXISTS (
        SELECT 1 FROM profiles emp_prof
        WHERE emp_prof.id = ee.employer_id
          AND emp_prof.active_company_id = v_schedule.company_id
      )
    )
      AND ee.employment_status = 'active';
  ELSE
    -- Return specific employees
    RETURN QUERY
    SELECT 
      ee.id,
      p.email,
      p.phone,
      p.full_name
    FROM employer_employees ee
    JOIN profiles p ON p.id = ee.employee_id
    WHERE (
      ee.company_id = v_schedule.company_id
      OR EXISTS (
        SELECT 1 FROM profiles emp_prof
        WHERE emp_prof.id = ee.employer_id
          AND emp_prof.active_company_id = v_schedule.company_id
      )
    )
      AND ee.employment_status = 'active'
      AND (ee.id = ANY(v_schedule.specific_employee_ids) OR v_schedule.specific_employee_ids IS NULL);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_attendance_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS attendance_schedule_updated_at ON attendance_link_schedules;
CREATE TRIGGER attendance_schedule_updated_at
  BEFORE UPDATE ON attendance_link_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_schedule_updated_at();

-- Comments
COMMENT ON TABLE attendance_link_schedules IS 'Automated schedules for daily attendance link generation and distribution';
COMMENT ON COLUMN attendance_link_schedules.check_in_time IS 'Time when check-in link becomes active (e.g., 09:00)';
COMMENT ON COLUMN attendance_link_schedules.check_out_time IS 'Time when check-out link becomes active (e.g., 17:00)';
COMMENT ON COLUMN attendance_link_schedules.link_valid_duration_hours IS 'How long the generated link remains valid (default: 2 hours)';
COMMENT ON COLUMN attendance_link_schedules.send_before_minutes IS 'Send notification this many minutes before check-in time (default: 15)';
COMMENT ON COLUMN attendance_link_schedules.notification_method IS 'Array of notification methods: email, sms, or both';

