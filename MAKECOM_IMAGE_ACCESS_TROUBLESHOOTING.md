# 🔍 Make.com Image Access Troubleshooting

**Error:** `[400] Invalid requests[14].replaceImage: There was a problem retrieving the image.`

---

## 🧪 Step 1: Run Comprehensive Diagnostics

Run this SQL script in Supabase SQL Editor:

```sql
scripts/diagnose-image-access.sql
```

This will check:

- ✅ Bucket public status
- ✅ RLS policies
- ✅ File existence and formats
- ✅ URL formats in database
- ✅ Generate correct test URLs

---

## 🔍 Step 2: Test Image Access Directly

### Manual Browser Test (Most Important!)

1. **Open Incognito/Private Browser Window** (to simulate unauthenticated access)

2. **Copy the URL from the diagnostic script** (Step 5 output)

3. **Paste and visit the URL**

**Expected:**

- ✅ **SUCCESS:** Image displays without login prompt
- ❌ **FAILURE:** "403 Forbidden" or login prompt

**If FAILURE:** The issue is with Supabase configuration (bucket/RLS)
**If SUCCESS:** The issue is with the URL being sent to Make.com

---

## 🔧 Step 3: Check Make.com Module 6 Configuration

### Your Make.com Module 6 Should Look Like This:

**Module:** Google Docs - Replace Image

**Configuration:**

```
Document ID: [from previous module]

Replace Image 1:
  - Find: {{promoter_id_card_photo}}
  - Replace with URL: {{1.promoter_id_card_url}}
  - Alternative: Use ifempty(1.promoter_id_card_url, "https://via.placeholder.com/400x300?text=No+ID+Card")

Replace Image 2:
  - Find: {{promoter_passport_photo}}
  - Replace with URL: {{1.promoter_passport_url}}
  - Alternative: Use ifempty(1.promoter_passport_url, "https://via.placeholder.com/400x300?text=No+Passport")
```

### ⚠️ Common Mistakes:

❌ **Wrong:** Using `{{promoter.id_card_url}}` (missing the module number)
✅ **Correct:** Using `{{1.promoter_id_card_url}}` (where 1 is your webhook module number)

❌ **Wrong:** Hardcoding a specific promoter's URL
✅ **Correct:** Using dynamic variable from webhook data

❌ **Wrong:** URL is partial: `"abdul_basit_121924781.jpeg"`
✅ **Correct:** URL is full: `"https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg"`

---

## 🐛 Step 4: Debug Make.com Scenario

### Check What URL is Actually Being Sent:

1. **Add a "Set Variable" module** before Module 6:

   ```
   Variable Name: debug_id_card_url
   Variable Value: {{1.promoter_id_card_url}}
   ```

2. **Run the scenario**

3. **Check the execution log** - see what value was stored

4. **Verify it's a full HTTPS URL**, not a partial filename

### Example Debug Output:

**❌ BAD (Partial URL):**

```
debug_id_card_url = "abdul_basit_121924781.jpeg"
```

**✅ GOOD (Full URL):**

```
debug_id_card_url = "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg"
```

---

## 🔧 Step 5: Common Fixes

### Fix 1: Ensure Database URLs are Full

If diagnostic shows partial URLs in database, run:

```sql
scripts/convert-to-full-urls-READY.sql
```

### Fix 2: Use ifempty() for Missing Images

In Make.com Module 6, wrap your URL variables:

```
ifempty({{1.promoter_id_card_url}}, "https://via.placeholder.com/400x300?text=No+ID+Card")
```

This provides a fallback if the promoter doesn't have a photo.

### Fix 3: Verify Image File Format and Size

Run diagnostic script and check Step 3 output:

- ✅ Format must be: `image/jpeg`, `image/png`, or `image/jpg`
- ✅ Size must be: < 5MB (5,242,880 bytes)

If issues found:

- Re-upload the image in correct format
- Compress large images
- Update the promoter's URL in database

### Fix 4: Check for CORS or Network Issues

Google Docs API requires:

- ✅ URL must be publicly accessible (no authentication)
- ✅ URL must return proper `Content-Type` header
- ✅ URL must not redirect (use final URL)
- ✅ Server must allow CORS from Google's IP ranges

Supabase handles all of this automatically when bucket is public.

---

## 📋 Checklist

Before re-running Make.com scenario, verify:

- [ ] Ran diagnostic script (`diagnose-image-access.sql`)
- [ ] Bucket is public (diagnostic Step 1 shows ✅)
- [ ] Public read policy exists (diagnostic Step 2 shows ✅)
- [ ] Files exist in storage (diagnostic Step 3 shows files)
- [ ] Promoter has full HTTPS URLs (diagnostic Step 4 shows ✅)
- [ ] Tested URL in incognito browser (image displays)
- [ ] Make.com uses correct variable `{{1.promoter_id_card_url}}`
- [ ] Make.com variable shows full URL in debug log
- [ ] Image format is JPEG/PNG (diagnostic Step 3)
- [ ] Image size is < 5MB (diagnostic Step 3)

---

## 🎯 Expected vs Actual

### What Should Happen:

1. Your API sends contract data to Make.com webhook
2. Webhook data includes:
   ```json
   {
     "promoter_id_card_url": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_121924781.jpeg",
     "promoter_passport_url": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/abdul_basit_131052976_passport.jpeg"
   }
   ```
3. Module 6 uses these URLs to replace placeholders
4. Google Docs API fetches images (no auth needed - public bucket)
5. Images embedded in document

### If You're Getting Error:

One of these is failing:

- ❌ URL is not full HTTPS format
- ❌ URL points to non-existent file
- ❌ File format is not supported
- ❌ File size exceeds limit
- ❌ Supabase bucket is not actually public
- ❌ RLS policy blocks unauthenticated access
- ❌ Make.com sending wrong variable

---

## 🆘 Still Not Working?

### Provide These Debug Details:

1. **Output from diagnostic script** (all 7 steps)
2. **Exact URL from Make.com execution log**
3. **Result of incognito browser test** (screenshot)
4. **Make.com Module 6 configuration** (screenshot)
5. **Promoter ID you're testing with**

### Alternative Solutions:

**Option 1: Use Base64 Encoding**

- Fetch image in Make.com
- Convert to Base64
- Embed Base64 directly in Google Doc

**Option 2: Use Google Drive**

- Upload images to Google Drive first
- Use Drive image URLs (always accessible)

**Option 3: Temporary Signed URLs**

- Generate Supabase signed URLs (1-hour expiry)
- Use those in Make.com
- More secure but requires code changes

---

**Last Updated:** October 16, 2025  
**Related:** `SUPABASE_RLS_PUBLIC_READ_FIX.md`, `MAKECOM_IMAGE_URL_FIX.md`
