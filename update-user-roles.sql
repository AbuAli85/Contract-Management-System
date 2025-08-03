-- SQL to update user role in profiles table
-- Run this in Supabase SQL editor or database management tool

-- First, check current role data
SELECT id, email, full_name, role, status 
FROM profiles 
WHERE email IN ('luxsess2001@gmail.com', 'operations@falconeyegroup.net');

-- Update the role to 'admin' for these users if they're currently showing as 'user'
UPDATE profiles 
SET role = 'admin', 
    updated_at = NOW()
WHERE email IN ('luxsess2001@gmail.com', 'operations@falconeyegroup.net')
  AND (role IS NULL OR role != 'admin');

-- Verify the update
SELECT id, email, full_name, role, status, updated_at
FROM profiles 
WHERE email IN ('luxsess2001@gmail.com', 'operations@falconeyegroup.net');
