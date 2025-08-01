# Document Upload Issue - Complete Solution

## 🚨 Problem Identified

The document upload functionality is "kicking out" users because the database migrations haven't been applied yet. This means:

1. **Missing Database Columns**: The `id_card_url` and `passport_url` columns don't exist in the `promoters` table
2. **Missing Storage Bucket**: The `promoter-documents` storage bucket hasn't been created
3. **Missing RLS Policies**: The storage bucket doesn't have proper access policies

## 🔧 Root Cause

When you try to upload documents, the form tries to save the document URLs to database columns that don't exist, causing the form submission to fail and "kick out" the user from the upload section.

## ✅ Complete Solution

### Step 1: Apply Database Migrations

Go to your **Supabase Dashboard** → **SQL Editor** and run these commands:

#### 1.1 Add Missing Promoter Fields

```sql
-- Add missing promoter fields that are referenced in the UI
DO $$
BEGIN
    -- Add missing personal information fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='date_of_birth') THEN
        ALTER TABLE promoters ADD COLUMN date_of_birth DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='gender') THEN
        ALTER TABLE promoters ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='marital_status') THEN
        ALTER TABLE promoters ADD COLUMN marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='city') THEN
        ALTER TABLE promoters ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='state') THEN
        ALTER TABLE promoters ADD COLUMN state TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='country') THEN
        ALTER TABLE promoters ADD COLUMN country TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='postal_code') THEN
        ALTER TABLE promoters ADD COLUMN postal_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='emergency_contact') THEN
        ALTER TABLE promoters ADD COLUMN emergency_contact TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='emergency_phone') THEN
        ALTER TABLE promoters ADD COLUMN emergency_phone TEXT;
    END IF;

    -- Add missing document fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='visa_number') THEN
        ALTER TABLE promoters ADD COLUMN visa_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='visa_expiry_date') THEN
        ALTER TABLE promoters ADD COLUMN visa_expiry_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='work_permit_number') THEN
        ALTER TABLE promoters ADD COLUMN work_permit_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='work_permit_expiry_date') THEN
        ALTER TABLE promoters ADD COLUMN work_permit_expiry_date DATE;
    END IF;

    -- Add missing professional fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='job_title') THEN
        ALTER TABLE promoters ADD COLUMN job_title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='company') THEN
        ALTER TABLE promoters ADD COLUMN company TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='department') THEN
        ALTER TABLE promoters ADD COLUMN department TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='specialization') THEN
        ALTER TABLE promoters ADD COLUMN specialization TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='experience_years') THEN
        ALTER TABLE promoters ADD COLUMN experience_years INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='education_level') THEN
        ALTER TABLE promoters ADD COLUMN education_level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='university') THEN
        ALTER TABLE promoters ADD COLUMN university TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='graduation_year') THEN
        ALTER TABLE promoters ADD COLUMN graduation_year INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='skills') THEN
        ALTER TABLE promoters ADD COLUMN skills TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='certifications') THEN
        ALTER TABLE promoters ADD COLUMN certifications TEXT;
    END IF;

    -- Add missing financial fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='bank_name') THEN
        ALTER TABLE promoters ADD COLUMN bank_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='account_number') THEN
        ALTER TABLE promoters ADD COLUMN account_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='iban') THEN
        ALTER TABLE promoters ADD COLUMN iban TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='swift_code') THEN
        ALTER TABLE promoters ADD COLUMN swift_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='tax_id') THEN
        ALTER TABLE promoters ADD COLUMN tax_id TEXT;
    END IF;

    -- Add missing preference fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='rating') THEN
        ALTER TABLE promoters ADD COLUMN rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='availability') THEN
        ALTER TABLE promoters ADD COLUMN availability TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='preferred_language') THEN
        ALTER TABLE promoters ADD COLUMN preferred_language TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='timezone') THEN
        ALTER TABLE promoters ADD COLUMN timezone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='special_requirements') THEN
        ALTER TABLE promoters ADD COLUMN special_requirements TEXT;
    END IF;

    -- Add missing address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='address') THEN
        ALTER TABLE promoters ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='national_id') THEN
        ALTER TABLE promoters ADD COLUMN national_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='crn') THEN
        ALTER TABLE promoters ADD COLUMN crn TEXT;
    END IF;

    -- Add document URL fields (CRITICAL for document upload)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='id_card_url') THEN
        ALTER TABLE promoters ADD COLUMN id_card_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='passport_url') THEN
        ALTER TABLE promoters ADD COLUMN passport_url TEXT;
    END IF;

END $$;
```

#### 1.2 Create Storage Bucket for Documents

```sql
-- Create storage bucket for promoter documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'promoter-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'promoter-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'promoter-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'promoter-documents' AND
  auth.role() = 'authenticated'
);

-- Create function to clean up documents when promoter is deleted
CREATE OR REPLACE FUNCTION cleanup_promoter_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all documents for the deleted promoter
  DELETE FROM storage.objects 
  WHERE bucket_id = 'promoter-documents' 
  AND name LIKE OLD.id || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up documents
DROP TRIGGER IF EXISTS cleanup_promoter_documents_trigger ON promoters;
CREATE TRIGGER cleanup_promoter_documents_trigger
  AFTER DELETE ON promoters
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_promoter_documents();
```

### Step 2: Test the Fix

After applying the migrations, you can test if everything is working:

1. **Test Database Columns**: The form should now save document URLs without errors
2. **Test Document Upload**: You should be able to upload ID and passport documents
3. **Test Document Display**: Existing documents should show with View/Download buttons

### Step 3: Verify Everything Works

1. Go to **Add New Promoter** or **Edit Promoter**
2. Fill in the form with some data
3. Try uploading an ID card or passport document
4. Save the form
5. Check that the document appears in the display section

## 🎯 What This Fixes

✅ **Document Upload**: ID and passport documents can now be uploaded  
✅ **Form Submission**: No more "kick out" when saving with documents  
✅ **Document Display**: Existing documents show with View/Download options  
✅ **All Form Fields**: All the missing fields are now available  
✅ **Dropdown Options**: Nationality, Job Title, Department, etc. now have dropdowns  
✅ **Data Persistence**: All form data saves correctly to the database  

## 🔍 Troubleshooting

If you still have issues after applying the migrations:

1. **Check Browser Console**: Look for any JavaScript errors
2. **Check Network Tab**: See if API calls are failing
3. **Verify Environment Variables**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
4. **Test Database Connection**: Run the test script to verify database access

## 📝 Summary

The "kick out" issue was caused by missing database columns. Once you apply these SQL migrations in your Supabase Dashboard, the document upload functionality will work perfectly, and all the form fields will be available and functional. 