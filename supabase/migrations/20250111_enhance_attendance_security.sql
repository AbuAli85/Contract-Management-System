-- Migration: Enhance Attendance Security
-- Date: 2025-01-11
-- Description: Add GPS tracking, photo capture, device fingerprinting, and manager approval to attendance

-- Add new columns to employee_attendance table
ALTER TABLE employee_attendance
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS check_in_photo TEXT,
  ADD COLUMN IF NOT EXISTS check_out_photo TEXT,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS device_info JSONB,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distance_from_office DECIMAL(10, 2); -- in meters

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_employee_attendance_approval_status ON employee_attendance(approval_status);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_approved_by ON employee_attendance(approved_by);

-- Create table for office locations (allowed check-in locations)
CREATE TABLE IF NOT EXISTS office_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 100, -- Allowed radius in meters
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_office_locations_company_id ON office_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_office_locations_is_active ON office_locations(is_active);

-- Create table for attendance verification logs
CREATE TABLE IF NOT EXISTS attendance_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES employee_attendance(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('location', 'photo', 'device', 'time', 'manual')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('passed', 'failed', 'warning')),
  verification_details JSONB,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_verification_logs_attendance_id ON attendance_verification_logs(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_verification_logs_status ON attendance_verification_logs(verification_status);

-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371000; -- Earth radius in meters
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance between two GPS coordinates using Haversine formula (returns meters)';

-- Function to verify location against office locations
CREATE OR REPLACE FUNCTION verify_attendance_location(
  p_attendance_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_company_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_office_location RECORD;
  v_distance DECIMAL;
  v_verified BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- Find nearest office location
  SELECT 
    id,
    name,
    latitude,
    longitude,
    radius_meters,
    calculate_distance(p_latitude, p_longitude, latitude, longitude) as distance
  INTO v_office_location
  FROM office_locations
  WHERE company_id = p_company_id
    AND is_active = true
  ORDER BY calculate_distance(p_latitude, p_longitude, latitude, longitude)
  LIMIT 1;

  IF v_office_location IS NULL THEN
    -- No office location configured, allow check-in
    v_verified := true;
    v_distance := 0;
  ELSE
    v_distance := v_office_location.distance;
    v_verified := v_distance <= v_office_location.radius_meters;
  END IF;

  -- Update attendance record
  UPDATE employee_attendance
  SET 
    location_verified = v_verified,
    distance_from_office = v_distance
  WHERE id = p_attendance_id;

  -- Log verification
  INSERT INTO attendance_verification_logs (
    attendance_id,
    verification_type,
    verification_status,
    verification_details
  ) VALUES (
    p_attendance_id,
    'location',
    CASE WHEN v_verified THEN 'passed' ELSE 'failed' END,
    jsonb_build_object(
      'office_location_id', v_office_location.id,
      'office_name', v_office_location.name,
      'distance_meters', v_distance,
      'allowed_radius', v_office_location.radius_meters,
      'verified', v_verified
    )
  );

  v_result := jsonb_build_object(
    'verified', v_verified,
    'distance_meters', v_distance,
    'office_location', v_office_location.name,
    'allowed_radius', v_office_location.radius_meters
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_attendance_location IS 'Verify if attendance location is within allowed office radius';

