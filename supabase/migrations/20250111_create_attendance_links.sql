-- Migration: Create Attendance Links System
-- Date: 2025-01-11
-- Description: Create system for location-restricted attendance check-in links

-- Table for attendance check-in links/sessions
CREATE TABLE IF NOT EXISTS attendance_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  link_code VARCHAR(50) UNIQUE NOT NULL, -- Unique code for the link
  title TEXT, -- Optional title/description
  target_latitude DECIMAL(10, 8) NOT NULL,
  target_longitude DECIMAL(11, 8) NOT NULL,
  allowed_radius_meters INTEGER DEFAULT 50, -- Allowed radius from target location
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL, -- Expiration time
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- Maximum number of check-ins allowed (NULL = unlimited)
  current_uses INTEGER DEFAULT 0,
  auto_generate_daily BOOLEAN DEFAULT false, -- Auto-generate daily at valid_from time
  office_location_id UUID REFERENCES office_locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_links_company_id ON attendance_links(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_links_link_code ON attendance_links(link_code);
CREATE INDEX IF NOT EXISTS idx_attendance_links_valid_until ON attendance_links(valid_until);
CREATE INDEX IF NOT EXISTS idx_attendance_links_is_active ON attendance_links(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_links_created_by ON attendance_links(created_by);

-- Table to track which employees have used which links (prevent duplicate check-ins)
CREATE TABLE IF NOT EXISTS attendance_link_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_link_id UUID REFERENCES attendance_links(id) ON DELETE CASCADE,
  employer_employee_id UUID REFERENCES employer_employees(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES employee_attendance(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  used_date DATE DEFAULT CURRENT_DATE, -- Date column for unique constraint
  latitude DECIMAL(10, 8), -- Location where link was used
  longitude DECIMAL(11, 8),
  distance_from_target DECIMAL(10, 2), -- Distance from target location
  location_verified BOOLEAN DEFAULT false,
  CONSTRAINT attendance_link_usage_unique UNIQUE (attendance_link_id, employer_employee_id, used_date)
);

-- Trigger to automatically set used_date when used_at changes
CREATE OR REPLACE FUNCTION set_attendance_link_usage_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.used_date := DATE(NEW.used_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_attendance_link_usage_date
  BEFORE INSERT OR UPDATE OF used_at ON attendance_link_usage
  FOR EACH ROW
  EXECUTE FUNCTION set_attendance_link_usage_date();

CREATE INDEX IF NOT EXISTS idx_attendance_link_usage_link_id ON attendance_link_usage(attendance_link_id);
CREATE INDEX IF NOT EXISTS idx_attendance_link_usage_employee_id ON attendance_link_usage(employer_employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_link_usage_date ON attendance_link_usage(used_date);

-- Function to generate unique link code
CREATE OR REPLACE FUNCTION generate_attendance_link_code()
RETURNS VARCHAR(50) AS $$
DECLARE
  code VARCHAR(50);
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    code := upper(
      substring(
        md5(random()::text || clock_timestamp()::text) 
        from 1 for 8
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM attendance_links WHERE link_code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_attendance_link_code IS 'Generates a unique 8-character code for attendance links';

-- Function to validate attendance link and location
CREATE OR REPLACE FUNCTION validate_attendance_link(
  p_link_code VARCHAR(50),
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_employee_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_link RECORD;
  v_employee_link RECORD;
  v_distance DECIMAL;
  v_verified BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get the attendance link
  SELECT * INTO v_link
  FROM attendance_links
  WHERE link_code = p_link_code
    AND is_active = true
    AND NOW() >= valid_from
    AND NOW() <= valid_until;
  
  IF v_link IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link not found, expired, or inactive'
    );
  END IF;
  
  -- Check if max uses reached
  IF v_link.max_uses IS NOT NULL AND v_link.current_uses >= v_link.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link has reached maximum uses'
    );
  END IF;
  
  -- Get employee's employer_employee record
  SELECT * INTO v_employee_link
  FROM employer_employees
  WHERE employee_id = p_employee_id
    AND employment_status = 'active'
    AND company_id = v_link.company_id
  LIMIT 1;
  
  IF v_employee_link IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Employee not found or not part of this company'
    );
  END IF;
  
  -- Check if employee already used this link today
  IF EXISTS (
    SELECT 1 FROM attendance_link_usage
    WHERE attendance_link_id = v_link.id
      AND employer_employee_id = v_employee_link.id
      AND DATE(used_at) = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'You have already checked in using this link today'
    );
  END IF;
  
  -- Calculate distance from target location
  v_distance := calculate_distance(
    p_latitude,
    p_longitude,
    v_link.target_latitude,
    v_link.target_longitude
  );
  
  -- Verify location
  v_verified := v_distance <= v_link.allowed_radius_meters;
  
  IF NOT v_verified THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('You must be within %s meters of the check-in location. Current distance: %s meters', 
        v_link.allowed_radius_meters, 
        ROUND(v_distance)
      ),
      'distance_meters', v_distance,
      'required_radius', v_link.allowed_radius_meters
    );
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'valid', true,
    'link_id', v_link.id,
    'employer_employee_id', v_employee_link.id,
    'distance_meters', v_distance,
    'location_verified', true
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_attendance_link IS 'Validates an attendance link code and verifies employee location';

-- Function to auto-generate daily attendance links
CREATE OR REPLACE FUNCTION auto_generate_daily_attendance_links()
RETURNS void AS $$
DECLARE
  v_link RECORD;
  v_new_code VARCHAR(50);
BEGIN
  -- Find all links that should be auto-generated daily
  FOR v_link IN
    SELECT * FROM attendance_links
    WHERE auto_generate_daily = true
      AND is_active = true
      AND valid_until >= CURRENT_DATE
      AND NOT EXISTS (
        -- Check if link already exists for today
        SELECT 1 FROM attendance_links
        WHERE office_location_id = v_link.office_location_id
          AND created_by = v_link.created_by
          AND DATE(valid_from) = CURRENT_DATE
      )
  LOOP
    -- Generate new code
    v_new_code := generate_attendance_link_code();
    
    -- Create new link for today
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
      is_active,
      max_uses,
      auto_generate_daily,
      office_location_id
    ) VALUES (
      v_link.company_id,
      v_link.created_by,
      v_new_code,
      COALESCE(v_link.title, 'Daily Check-In') || ' - ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
      v_link.target_latitude,
      v_link.target_longitude,
      v_link.allowed_radius_meters,
      CURRENT_DATE + (v_link.valid_from::time),
      CURRENT_DATE + (v_link.valid_until::time),
      true,
      v_link.max_uses,
      true,
      v_link.office_location_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_generate_daily_attendance_links IS 'Auto-generates daily attendance links for links marked with auto_generate_daily';

-- Add helpful comments
COMMENT ON TABLE attendance_links IS 'Stores location-restricted attendance check-in links generated by managers';
COMMENT ON COLUMN attendance_links.link_code IS 'Unique code used in the check-in URL';
COMMENT ON COLUMN attendance_links.allowed_radius_meters IS 'Maximum distance in meters from target location to allow check-in';
COMMENT ON COLUMN attendance_links.auto_generate_daily IS 'If true, automatically generates a new link each day at valid_from time';

