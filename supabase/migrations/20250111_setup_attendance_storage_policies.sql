-- Migration: Setup Attendance Photos Storage Policies
-- Date: 2025-01-11
-- Description: Create RLS policies for attendance photos storage
-- 
-- IMPORTANT: This migration must be run with service role permissions
-- or through Supabase Dashboard SQL Editor
-- 
-- If you get permission errors, create these policies manually:
-- 1. Go to Supabase Dashboard → Storage → attendance-photos → Policies
-- 2. Click "New Policy" and create each policy below
-- 3. Or run this file using the service role key

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Employees can upload own attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view own attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Managers can view all attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete attendance photos" ON storage.objects;

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

