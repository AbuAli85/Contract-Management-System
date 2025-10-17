# 🖼️ Make.com Image URL Error - Complete Fix Guide

**Error:** `[400] Invalid requests[12].replaceImage: The URL should not be empty.`

**Cause:** Trying to replace images in Google Docs template with empty/null URLs

---

## 🔍 **Root Cause**

When generating a contract via Make.com:
1. The webhook sends promoter data including `id_card_url` and `passport_url`
2. Make.com tries to replace images in the Google Docs template
3. If these URLs are **NULL** or **empty**, Google Docs API rejects the request
4. Result: Error and contract generation fails

---

## 📊 **Check Your Data First**

Run this SQL in Supabase to see how many promoters have missing image URLs:

```sql
SELECT 
  COUNT(*) as total_promoters,
  COUNT(id_card_url) as has_id_card_url,
  COUNT(passport_url) as has_passport_url,
  COUNT(CASE WHEN id_card_url IS NULL THEN 1 END) as missing_id_card_url,
  COUNT(CASE WHEN passport_url IS NULL THEN 1 END) as missing_passport_url
FROM promoters;
```

**Expected Result:**
- 112 total promoters
- 49 have ID card URLs
- 24 have passport URLs
- **63 missing ID card URLs** ⚠️
- **88 missing passport URLs** ⚠️

---

## ✅ **SOLUTION 1: Fix Make.com Module (Recommended)**

Update your **Google Docs module** in Make.com to handle empty URLs gracefully.

### **Current (Broken) Configuration:**

```javascript
Image Replacement:
- ID_CARD_IMAGE: {{1.promoter_id_card_url}}
- PASSPORT_IMAGE: {{1.promoter_passport_url}}
```

### **Fixed Configuration (With Fallbacks):**

```javascript
Image Replacement:
- ID_CARD_IMAGE: {{if(length(1.promoter_id_card_url) > 0; 1.promoter_id_card_url; "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop")}}

- PASSPORT_IMAGE: {{if(length(1.promoter_passport_url) > 0; 1.promoter_passport_url; "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop")}}
```

### **Alternative (Cleaner):**

Use `ifempty()` function:

```javascript
- ID_CARD_IMAGE: {{ifempty(1.promoter_id_card_url; "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400")}}

- PASSPORT_IMAGE: {{ifempty(1.promoter_passport_url; "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400")}}
```

**What This Does:**
- ✅ If URL exists → Use the actual document photo
- ✅ If URL is empty/null → Use placeholder image
- ✅ Contract generation always succeeds

---

## ✅ **SOLUTION 2: Remove Image Replacements (Quick Fix)**

If you don't need images right now:

### **Step 1: Open Make.com Scenario**

1. Go to your Make.com scenario
2. Click on the **Google Docs** module (usually Module #6)

### **Step 2: Remove Image Replacement Section**

1. Scroll to **"Images Replacement"** section
2. **Delete** both entries:
   - Remove `ID_CARD_IMAGE`
   - Remove `PASSPORT_IMAGE`
3. **Save** the module

### **Step 3: Test**

Contracts will generate **without images** but won't fail!

---

## ✅ **SOLUTION 3: Set Placeholder URLs in Database**

Add default placeholder images to all promoters missing URLs:

```sql
-- Set placeholder for missing ID card images
UPDATE promoters
SET id_card_url = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop'
WHERE id_card_url IS NULL;

-- Set placeholder for missing passport images
UPDATE promoters
SET passport_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop'
WHERE passport_url IS NULL;

-- Verify
SELECT 
  COUNT(*) as total,
  COUNT(id_card_url) as has_id_card,
  COUNT(passport_url) as has_passport
FROM promoters;
```

**Result:**
- ✅ All promoters now have image URLs
- ✅ Contracts generate successfully
- ⚠️ Placeholders used until real photos uploaded

---

## ✅ **SOLUTION 4: Use Supabase Storage URLs (Best Long-Term)**

Since you already have photos in `promoter-documents` bucket:

### **Step 1: Generate Full Supabase URLs**

```sql
-- Update to use full Supabase Storage URLs
UPDATE promoters
SET 
  id_card_url = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/promoter-documents/' || id_card_url,
  passport_url = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/promoter-documents/' || passport_url
WHERE 
  id_card_url IS NOT NULL 
  AND id_card_url NOT LIKE 'https://%';
```

**Replace `[YOUR-PROJECT]` with your actual Supabase project ID!**

### **Step 2: Verify URLs Work**

Test one URL in your browser:
```
https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/promoter-documents/muhammad_ehtisham_zubair_131052976.png
```

Should display the image!

---

## 🎯 **Recommended Approach**

**Combine Solutions:**

1. ✅ **Fix Make.com** (Solution 1) - Add fallback logic
2. ✅ **Fix Database URLs** (Solution 4) - Use full Supabase URLs
3. ✅ **Set Placeholders** (Solution 3) - For promoters without uploads

### **Complete Fix Script:**

```sql
-- 1. Update existing partial URLs to full URLs
UPDATE promoters
SET 
  id_card_url = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/promoter-documents/' || id_card_url
WHERE 
  id_card_url IS NOT NULL 
  AND id_card_url NOT LIKE 'https://%';

UPDATE promoters
SET 
  passport_url = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/promoter-documents/' || passport_url
WHERE 
  passport_url IS NOT NULL 
  AND passport_url NOT LIKE 'https://%';

-- 2. Set placeholders for missing images
UPDATE promoters
SET id_card_url = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop'
WHERE id_card_url IS NULL;

UPDATE promoters
SET passport_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop'
WHERE passport_url IS NULL;

-- 3. Verify all promoters have URLs
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN id_card_url IS NOT NULL AND id_card_url != '' THEN 1 END) as has_id_card,
  COUNT(CASE WHEN passport_url IS NOT NULL AND passport_url != '' THEN 1 END) as has_passport
FROM promoters;
```

**Expected Result:** All 112 promoters have image URLs ✅

---

## 🧪 **Testing Steps**

### **After Fix:**

1. **Generate a contract** from your system
2. **Check if it succeeds** without the image URL error
3. **Open the generated PDF** and verify:
   - Real photos appear for promoters with uploaded documents
   - Placeholder images appear for promoters without documents
   - No errors or blank spaces

---

## 📋 **Make.com Module Configuration**

### **Complete Google Docs Module Setup:**

```json
{
  "module": "google-docs:createADocumentFromTemplate",
  "mapper": {
    "name": "{{1.contract_number}}-{{1.promoter_name_en}}.pdf",
    "document": "YOUR-TEMPLATE-ID",
    "imageReplacement": [
      {
        "imageObjectId": "ID_CARD_IMAGE",
        "url": "{{ifempty(1.promoter_id_card_url; \"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400\")}}"
      },
      {
        "imageObjectId": "PASSPORT_IMAGE",
        "url": "{{ifempty(1.promoter_passport_url; \"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400\")}}"
      }
    ]
  }
}
```

---

## ⚠️ **Important Notes**

1. **Image Placeholders Must Exist** in your Google Docs template with Alt text:
   - `ID_CARD_IMAGE`
   - `PASSPORT_IMAGE`

2. **URLs Must Be Publicly Accessible:**
   - Supabase Storage URLs work if bucket is public
   - Unsplash URLs always work
   - Google Drive URLs need proper sharing settings

3. **Make.com Functions:**
   - ✅ `ifempty()` - Checks if variable is empty
   - ✅ `if()` - Conditional logic
   - ✅ `length()` - String length
   - ❌ `exists()` - NOT supported!

---

## 🎯 **Quick Summary**

| Problem | Solution | Priority |
|---------|----------|----------|
| Empty URLs causing errors | Add fallbacks in Make.com | ⭐⭐⭐ High |
| Partial URLs (no https://) | Prepend Supabase URL | ⭐⭐ Medium |
| Missing photos | Upload or set placeholders | ⭐ Low |

---

**After applying these fixes, all contract generations should succeed!** ✅

**Questions? Check the diagnostic script:** `scripts/check-missing-image-urls.sql`

---

**Last Updated:** October 16, 2025




