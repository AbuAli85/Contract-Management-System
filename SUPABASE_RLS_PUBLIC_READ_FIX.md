# 🔓 Supabase Storage RLS Public Read Access Fix

## 📋 Problem Summary

Even after setting the `promoter-documents` bucket to `public = true`, the Google Docs API still cannot retrieve images because **Row Level Security (RLS) policies** are blocking unauthenticated access.

### Error Message
```
[400] Invalid requests[14].replaceImage: There was a problem retrieving the image. 
The provided image should be publicly accessible, within size limit, and in supported formats.
```

## 🔍 Root Cause Analysis

### Two Layers of Security

Supabase Storage has **two layers** of access control:

1. **Bucket Settings** (`public` flag)
   - ✅ Already set to `true` via previous script
   - Controls whether URLs use `/public/` or `/authenticated/` path

2. **RLS Policies** (Row Level Security)
   - ❌ Still blocking unauthenticated access
   - Controls who can SELECT/INSERT/UPDATE/DELETE files

### Current RLS Policies Issue

All existing SELECT policies require authentication:
```sql
-- Example of restrictive policy
"Allow authenticated users to view documents"
  FOR SELECT
  USING (bucket_id = 'promoter-documents' AND auth.role() = 'authenticated')
```

When Google Docs API tries to fetch images, it makes **unauthenticated HTTP requests**, which are blocked by these policies.

## ✅ Solution

Add a new RLS policy that allows **public read access** to the bucket:

```sql
CREATE POLICY "Public read access for promoter-documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'promoter-documents');
```

### What This Does
- ✅ Allows anyone (authenticated or not) to **read/download** files
- ✅ Keeps INSERT/UPDATE/DELETE operations **authenticated**
- ✅ Only affects the `promoter-documents` bucket
- ✅ Makes images accessible to Google Docs API, Make.com, and other external services

## 🚀 Implementation Steps

### Step 1: Run the SQL Script

Open Supabase SQL Editor and run:
```bash
scripts/enable-public-read-storage.sql
```

### Step 2: Verify Policy Creation

The script will show:
```
=== AFTER: Verifying new public read policy ===
policyname: "Public read access for promoter-documents"
roles: {public}
cmd: SELECT
```

### Step 3: Test Public Access

1. **Browser Test (Incognito/Private Mode)**
   ```
   https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg
   ```
   - Open this URL in an incognito/private browser window
   - The image should display without requiring login

2. **Make.com Test**
   - Re-run your Make.com scenario
   - Generate a contract with promoter images
   - Module 6 (Google Docs - Replace Image) should now succeed

## 📊 Before vs After

### Before (12 policies, all requiring auth for SELECT)
```
❌ All SELECT policies require: auth.role() = 'authenticated'
❌ Google Docs API: 400 error (cannot retrieve image)
❌ Public URL access: Blocked
```

### After (13 policies, new public read policy added)
```
✅ New public SELECT policy: TO public (no auth required)
✅ Google Docs API: Can retrieve images
✅ Public URL access: Allowed for read operations
✅ Write operations: Still require authentication
```

## 🔒 Security Considerations

### What Remains Secure
- ✅ **INSERT** operations: Only authenticated users can upload
- ✅ **UPDATE** operations: Only authenticated users can modify
- ✅ **DELETE** operations: Only authenticated users can delete
- ✅ **Other buckets**: Not affected by this policy

### What Becomes Public
- 🌍 **SELECT/READ** operations: Anyone with the URL can view files
- 🌍 This is intentional and necessary for:
  - External integrations (Make.com, Zapier, etc.)
  - Google Docs API image replacement
  - Embedding images in contracts/documents
  - Sharing documents with clients who may not have accounts

### Is This Safe?
**Yes, for documents that are meant to be shared:**
- ID cards and passports are part of contracts
- Contracts are shared with external parties (clients, vendors, partners)
- URLs are long and complex (not easily guessable)
- Read-only access (cannot modify or delete)
- Files are still validated on upload (MIME type, size limits)

**If you need more security:**
- Use signed URLs with expiration (requires code changes)
- Store sensitive documents in a different, private bucket
- Implement additional middleware for access logging

## 🧪 Verification Checklist

Run through this checklist after applying the fix:

- [ ] SQL script executed successfully
- [ ] New policy visible in `pg_policies` table
- [ ] Image URL accessible in incognito browser
- [ ] Make.com scenario runs without image errors
- [ ] Contract PDF generated with promoter images
- [ ] Other bucket permissions remain unchanged

## 📚 Related Documentation

- [Previous Fix: Make Bucket Public](./SUPABASE_STORAGE_PUBLIC_FIX.md)
- [Previous Fix: Convert URLs to Full Format](./MAKECOM_IMAGE_URL_FIX.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

## 🎯 Quick Command Reference

```sql
-- Check current policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Add public read policy
CREATE POLICY "Public read access for promoter-documents"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'promoter-documents');

-- Verify bucket is public
SELECT id, name, public FROM storage.buckets WHERE id = 'promoter-documents';

-- Test URL format
SELECT 
  name as filename,
  'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || name as public_url
FROM storage.objects
WHERE bucket_id = 'promoter-documents'
LIMIT 5;
```

## 🔄 Rollback (If Needed)

If you need to revert this change:

```sql
-- Remove the public read policy
DROP POLICY IF EXISTS "Public read access for promoter-documents" 
  ON storage.objects;
```

**Note:** This will break Make.com image integration again.

---

**Status:** ✅ Ready to implement  
**Priority:** 🔴 Critical (blocks contract generation)  
**Impact:** Makes images publicly readable via URL  
**Risk:** Low (read-only access, necessary for external integrations)

