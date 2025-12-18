-- Migration: Setup Office Locations
-- Date: 2025-01-11
-- Description: Create initial office locations and setup instructions

-- Insert example office locations (update with your actual office coordinates)
-- You can add more locations by inserting into office_locations table

-- Example: Main Office (update coordinates to your actual office location)
INSERT INTO office_locations (
  company_id,
  name,
  address,
  latitude,
  longitude,
  radius_meters,
  is_active
) VALUES (
  (SELECT id FROM companies LIMIT 1), -- Use your actual company_id
  'Main Office',
  '123 Business Street, City, Country',
  24.7136,  -- Update with your office latitude
  46.6753,  -- Update with your office longitude
  100,      -- 100 meters radius
  true
) ON CONFLICT DO NOTHING;

-- Example: Branch Office (if you have multiple locations)
-- INSERT INTO office_locations (
--   company_id,
--   name,
--   address,
--   latitude,
--   longitude,
--   radius_meters,
--   is_active
-- ) VALUES (
--   (SELECT id FROM companies LIMIT 1),
--   'Branch Office',
--   '456 Another Street, City, Country',
--   24.8000,  -- Update with your branch office latitude
--   46.7000,  -- Update with your branch office longitude
--   150,      -- 150 meters radius
--   true
-- ) ON CONFLICT DO NOTHING;

-- Create a function to get office locations for a company
CREATE OR REPLACE FUNCTION get_company_office_locations(p_company_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  radius_meters INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ol.id,
    ol.name,
    ol.address,
    ol.latitude,
    ol.longitude,
    ol.radius_meters,
    ol.is_active
  FROM office_locations ol
  WHERE ol.company_id = p_company_id
    AND ol.is_active = true
  ORDER BY ol.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_company_office_locations(UUID) IS 'Get all active office locations for a company';

-- Create a view for easy access to office locations with company info
CREATE OR REPLACE VIEW office_locations_with_company AS
SELECT 
  ol.id,
  ol.company_id,
  ol.name,
  ol.address,
  ol.latitude,
  ol.longitude,
  ol.radius_meters,
  ol.is_active,
  ol.created_at,
  ol.updated_at,
  c.name as company_name
FROM office_locations ol
JOIN companies c ON ol.company_id = c.id
WHERE ol.is_active = true;

COMMENT ON VIEW office_locations_with_company IS 'View of active office locations with company information';

-- Add helpful comments
COMMENT ON TABLE office_locations IS 'Stores allowed office locations for attendance check-in. Employees must be within the specified radius to verify location.';
COMMENT ON COLUMN office_locations.radius_meters IS 'Allowed radius in meters from the office location for attendance verification';
COMMENT ON COLUMN office_locations.latitude IS 'Office location latitude (decimal degrees)';
COMMENT ON COLUMN office_locations.longitude IS 'Office location longitude (decimal degrees)';

