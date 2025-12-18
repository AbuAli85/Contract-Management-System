-- Migration: Setup Attendance Photos Storage
-- Date: 2025-01-11
-- Description: Setup instructions for attendance photos storage bucket
--
-- IMPORTANT: This migration file contains INSTRUCTIONS ONLY, no executable SQL.
-- Storage buckets and policies cannot be created via SQL migrations due to permission restrictions.
-- Follow the instructions below to set up the storage bucket manually.

-- Step 1: Create the storage bucket
-- IMPORTANT: Storage buckets CANNOT be created via SQL migrations due to permission restrictions.
-- You MUST create the bucket manually through Supabase Dashboard:
--
-- Instructions:
-- 1. Go to Supabase Dashboard → Storage → Buckets
-- 2. Click "New Bucket"
-- 3. Configure:
--    - Name: attendance-photos
--    - Public: false (private bucket)
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/jpg
-- 4. Click "Create bucket"
--
-- After creating the bucket, run the policies migration:
-- supabase/migrations/20250111_setup_attendance_storage_policies.sql

-- Step 2: Storage Policies
-- NOTE: These policies need to be created manually through Supabase Dashboard
-- or using a service role connection due to permission requirements.
-- 
-- Go to: Storage → attendance-photos → Policies → New Policy
-- 
-- Or run these SQL commands in Supabase Dashboard SQL Editor (they require elevated permissions):

/*
-- Policy 1: Employees can upload their own attendance photos
CREATE POLICY "Employees can upload own attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Employees can view their own attendance photos
CREATE POLICY "Employees can view own attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Managers/Employers can view all attendance photos
CREATE POLICY "Managers can view all attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employer', 'manager')
  )
);

-- Policy 4: Managers/Employers can delete attendance photos (for cleanup)
CREATE POLICY "Managers can delete attendance photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attendance-photos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employer', 'manager')
  )
);
*/

-- Note: This migration file serves as documentation only.
-- The actual bucket creation must be done through Supabase Dashboard.
-- See docs/ATTENDANCE_SETUP.md for complete setup instructions.

