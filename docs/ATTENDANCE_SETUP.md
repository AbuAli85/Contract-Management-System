# Attendance System Setup Guide

This guide will help you set up the smart attendance system with location verification and photo capture.

## Prerequisites

1. Supabase project with the migrations applied
2. Storage bucket for attendance photos
3. Office location coordinates

## Step 1: Create Storage Bucket for Attendance Photos

### Using Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `attendance-photos`
   - **Public**: `false` (private bucket)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Set Up Storage Policies:

After creating the bucket, set up Row Level Security (RLS) policies:

```sql
-- Allow employees to upload their own attendance photos
CREATE POLICY "Employees can upload own attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow employees to view their own attendance photos
CREATE POLICY "Employees can view own attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow employers/managers to view all attendance photos
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
```

### Using Supabase CLI:

```bash
# Create bucket
supabase storage create attendance-photos --public false

# Or use the SQL editor in Supabase dashboard
```

## Step 2: Configure Office Locations

### Option A: Using SQL (Recommended)

1. Open Supabase SQL Editor
2. Run the following query to add your office location:

```sql
-- Replace with your actual company ID and coordinates
INSERT INTO office_locations (
  company_id,
  name,
  address,
  latitude,
  longitude,
  radius_meters,
  is_active
) VALUES (
  'your-company-id-here',  -- Get from companies table
  'Main Office',
  'Your Office Address',
  24.7136,  -- Your office latitude (get from Google Maps)
  46.6753,  -- Your office longitude (get from Google Maps)
  100,      -- Radius in meters (100m = ~328 feet)
  true
);
```

### Option B: Using the Application (Future Feature)

A UI component can be created to manage office locations through the admin panel.

### Finding Your Office Coordinates:

1. Open Google Maps
2. Search for your office address
3. Right-click on the location → Click on coordinates
4. Copy the latitude and longitude values

### Multiple Office Locations:

If you have multiple offices, add each one:

```sql
INSERT INTO office_locations (
  company_id,
  name,
  address,
  latitude,
  longitude,
  radius_meters,
  is_active
) VALUES 
  ('company-id', 'Main Office', 'Address 1', 24.7136, 46.6753, 100, true),
  ('company-id', 'Branch Office', 'Address 2', 24.8000, 46.7000, 150, true),
  ('company-id', 'Remote Office', 'Address 3', 24.9000, 46.8000, 200, true);
```

## Step 3: Verify Setup

### Check Storage Bucket:

```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'attendance-photos';
```

### Check Office Locations:

```sql
-- List all office locations
SELECT * FROM office_locations WHERE is_active = true;

-- Check locations for a specific company
SELECT * FROM get_company_office_locations('your-company-id');
```

### Test Location Verification:

```sql
-- Test location verification function
SELECT verify_attendance_location(
  NULL,  -- attendance_id (can be NULL for testing)
  24.7136,  -- test latitude
  46.6753,  -- test longitude
  'your-company-id'
);
```

## Step 4: Manager Dashboard Integration

The attendance approval dashboard component is ready to use. Add it to your manager/employer dashboard:

```tsx
import { AttendanceApprovalDashboard } from '@/components/employer/attendance-approval-dashboard';

// In your manager dashboard page
<AttendanceApprovalDashboard />
```

## Step 5: Permissions Setup

Ensure managers have the correct permissions:

```sql
-- Grant attendance approval permission to managers
-- This should already be handled by your RBAC system
-- Check that 'attendance:approve:all' permission exists
SELECT * FROM permissions WHERE name = 'attendance:approve:all';
```

## Troubleshooting

### Photos Not Uploading:

1. Check storage bucket exists: `SELECT * FROM storage.buckets WHERE name = 'attendance-photos';`
2. Verify RLS policies are set correctly
3. Check file size (should be < 5MB)
4. Verify user has authenticated session

### Location Verification Not Working:

1. Ensure office locations are configured: `SELECT * FROM office_locations;`
2. Check coordinates are correct (use Google Maps to verify)
3. Verify `verify_attendance_location` function exists: `\df verify_attendance_location`
4. Check radius is appropriate (100m = ~328 feet)

### Manager Cannot Approve:

1. Verify manager has `attendance:approve:all` permission
2. Check manager's role in profiles table
3. Ensure manager is linked to the same company as employees

## Best Practices

1. **Radius Settings**: 
   - Office building: 50-100 meters
   - Large campus: 200-500 meters
   - Remote work: Consider disabling location verification

2. **Photo Quality**:
   - Keep file size limit reasonable (5MB)
   - Use JPEG format for better compression
   - Consider image optimization on client side

3. **Location Accuracy**:
   - GPS accuracy can vary (10-50 meters typical)
   - Set radius accordingly
   - Consider using WiFi-based location for better accuracy

4. **Privacy**:
   - Photos are stored securely in private bucket
   - Only managers and the employee can view their photos
   - Consider data retention policies

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Verify all migrations are applied
3. Test API endpoints directly
4. Review browser console for client-side errors

