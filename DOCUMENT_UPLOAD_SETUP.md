# Document Upload Setup Guide

## Overview
This guide explains how to configure the Supabase storage bucket for document uploads in the SmartPro Portal.

---

## Prerequisites

- Supabase project created
- Admin access to Supabase dashboard
- `react-dropzone` installed (✅ Done)

---

## Step 1: Create Storage Bucket

### Option A: Via Supabase Dashboard (Recommended)

1. **Navigate to Storage:**
   - Open Supabase dashboard: https://supabase.com/dashboard
   - Select your project
   - Click "Storage" in the left sidebar

2. **Create Bucket:**
   - Click "New bucket"
   - Bucket name: `promoter-documents`
   - Public bucket: **No** (keep private for security)
   - File size limit: `10 MB`
   - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
   - Click "Create bucket"

### Option B: Via SQL

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promoter-documents',
  'promoter-documents',
  false,
  10485760, -- 10 MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);
```

---

## Step 2: Configure Row Level Security (RLS)

### Policy 1: Allow Authenticated Users to Upload

```sql
-- Allow authenticated users to upload their documents
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'promoter-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow Users to Read Their Own Documents

```sql
-- Allow users to read documents in their folder
CREATE POLICY "Allow user to read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'promoter-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow Admin to Read All Documents

```sql
-- Allow admins to read all documents
CREATE POLICY "Allow admin to read all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'promoter-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

### Policy 4: Allow Users to Update/Delete Their Documents

```sql
-- Allow users to update their own documents
CREATE POLICY "Allow user to update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'promoter-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Allow user to delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'promoter-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Step 3: Update Promoters Table (If Needed)

Ensure the promoters table has columns for document URLs:

```sql
-- Add document URL columns if they don't exist
ALTER TABLE promoters
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS passport_url TEXT,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promoters_id_card_url ON promoters(id_card_url);
CREATE INDEX IF NOT EXISTS idx_promoters_passport_url ON promoters(passport_url);
```

---

## Step 4: Test Document Upload

### Test Upload via Component

1. Navigate to Promoters page
2. Click "Add Promoter" or edit an existing promoter
3. Go to "Documents" tab
4. Click "Upload" next to a document type
5. Select or drag & drop a file
6. Fill in document number and expiry date
7. Click "Upload Document"

### Verify Upload in Supabase

1. Go to Storage > promoter-documents
2. You should see folder structure: `{promoter-id}/id_card_*.pdf`
3. Check promoters table for updated URL

### Test via SQL

```sql
-- Check if documents were uploaded
SELECT 
  id,
  name_en,
  id_card_url,
  passport_url,
  documents
FROM promoters
WHERE id_card_url IS NOT NULL
LIMIT 10;
```

---

## File Structure

Documents are organized as:

```
promoter-documents/
├── {promoter-id-1}/
│   ├── id_card_1698765432000.pdf
│   ├── passport_1698765433000.pdf
│   ├── work_permit_1698765434000.pdf
│   └── health_certificate_1698765435000.jpg
├── {promoter-id-2}/
│   ├── id_card_1698765436000.pdf
│   └── passport_1698765437000.png
└── ...
```

**Format:** `{promoter-id}/{document-type}_{timestamp}.{extension}`

---

## Security Considerations

### 1. File Type Validation

**Client-side (React):**
```typescript
accept: {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}
```

**Server-side (Supabase Storage):**
```sql
allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png']
```

### 2. File Size Limit

**Client-side:**
```typescript
maxSize: 10 * 1024 * 1024 // 10MB
```

**Server-side:**
```sql
file_size_limit = 10485760 -- 10 MB in bytes
```

### 3. Authentication

All upload operations require:
- Valid Supabase auth session
- User must be authenticated
- RLS policies enforce access control

### 4. File Naming

Files use timestamp-based naming to:
- Prevent filename collisions
- Allow version history
- Enable sorting by upload date

---

## Troubleshooting

### Issue: "Failed to upload document"

**Check:**
1. Supabase storage bucket exists
2. RLS policies are configured
3. User is authenticated
4. File meets size/type requirements

**Debug:**
```javascript
// In browser console
const supabase = createClient();
const { data: session } = await supabase.auth.getSession();
console.log('Authenticated:', !!session.session);

const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);
```

### Issue: "Permission denied"

**Check RLS Policies:**
```sql
-- List all policies for storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Test policy for current user
SELECT storage.objects.name
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
AND auth.uid() = (storage.foldername(name))[1]::uuid;
```

### Issue: "File too large"

**Solution:**
- Reduce file size or
- Increase bucket limit:

```sql
UPDATE storage.buckets
SET file_size_limit = 20971520 -- 20 MB
WHERE id = 'promoter-documents';
```

---

## Advanced Configuration

### Image Compression

Add image compression before upload:

```typescript
import imageCompression from 'browser-image-compression';

const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression failed:', error);
    return file;
  }
};
```

### PDF Thumbnail Generation

Add thumbnail generation for PDFs:

```typescript
import * as pdfjsLib from 'pdfjs-dist';

const generatePdfThumbnail = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const page = await pdf.getPage(1);
  
  const viewport = page.getViewport({ scale: 0.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({ canvasContext: context, viewport }).promise;
  
  return canvas.toDataURL('image/jpeg', 0.8);
};
```

### OCR for Document Parsing

Add OCR to extract text from documents:

```typescript
import Tesseract from 'tesseract.js';

const extractTextFromImage = async (file: File) => {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (m) => console.log(m),
  });
  
  return result.data.text;
};
```

---

## Monitoring & Analytics

### Track Upload Success Rate

```typescript
// Add to upload handler
const trackUpload = async (status: 'success' | 'error', documentType: string) => {
  await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'document_upload',
      properties: {
        status,
        documentType,
        timestamp: new Date().toISOString(),
      },
    }),
  });
};
```

### Storage Usage Dashboard

Create admin dashboard to monitor storage:

```sql
-- Get storage usage by promoter
SELECT 
  p.id,
  p.name_en,
  COUNT(o.name) as document_count,
  SUM(o.metadata->>'size')::bigint as total_size_bytes,
  ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM promoters p
LEFT JOIN storage.objects o ON (storage.foldername(o.name))[1] = p.id::text
WHERE o.bucket_id = 'promoter-documents'
GROUP BY p.id, p.name_en
ORDER BY total_size_bytes DESC
LIMIT 20;
```

---

## Checklist

### Initial Setup
- [ ] Storage bucket `promoter-documents` created
- [ ] RLS policies configured
- [ ] Promoters table has URL columns
- [ ] `react-dropzone` installed

### Testing
- [ ] Upload works for authenticated users
- [ ] File type validation works
- [ ] File size validation works
- [ ] Drag & drop works
- [ ] Files appear in storage
- [ ] URLs saved to database

### Security
- [ ] RLS policies tested
- [ ] Only authenticated users can upload
- [ ] Users can only access their own documents
- [ ] Admins can access all documents
- [ ] File type restrictions enforced
- [ ] File size limits enforced

### Production
- [ ] Error handling tested
- [ ] Loading states work correctly
- [ ] Success/error messages display
- [ ] Mobile upload works
- [ ] Large files handle gracefully

---

## Status

✅ **Component Ready** - Document upload component updated  
✅ **Dependencies Installed** - react-dropzone installed  
⏳ **Pending** - Supabase bucket and RLS configuration  
⏳ **Pending** - Production testing

---

**Created:** October 29, 2025  
**Last Updated:** October 29, 2025  
**Version:** 1.0

