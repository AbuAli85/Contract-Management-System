# Complete Make.com Setup Guide - Text + Images

## For Your Promoter Assignment Contract Template

---

## **📋 Your Template Requirements**

Based on your template, you need:

### **Text Replacements: 12 fields**

1. `{{ref_number}}`
2. `{{first_party_name_ar}}`
3. `{{first_party_crn}}`
4. `{{second_party_name_ar}}`
5. `{{second_party_crn}}`
6. `{{promoter_name_ar}}`
7. `{{id_card_number}}`
8. `{{contract_start_date}}`
9. `{{contract_end_date}}`
10. `{{first_party_name_en}}`
11. `{{second_party_name_en}}`
12. `{{promoter_name_en}}`

### **Image Replacements: 2 images**

1. **ID Card Photo** (صورة البطاقة)
2. **Passport Photo** (صورة الجواز)

---

## **🎯 PHASE 1: Setup Text Replacements (DO THIS FIRST)**

### **Step 1: Prepare Your Template**

1. Open: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit
2. Make sure all 12 text placeholders exist (they already do based on what you shared)
3. Add 2 placeholder images:
   - One for ID card (any grey square image)
   - One for passport (any grey square image)
4. **Right-click each image → Alt text:**
   - ID card image: Title = `image_1`
   - Passport image: Title = `image_2`
5. Save template

### **Step 2: Configure Make.com Module for Text**

Your current module configuration:

```yaml
Module: Google Docs → Replace Text in a Document

Connection: My Google connection
Choose a Drive: My Drive
Document ID: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0

Replace a Text: [Turn OFF "Map" toggle, then add 12 items]
```

**Add these 12 items using "Add item" button:**

```
1. Find: {{ref_number}} → Replace: {{1.ref_number}}
2. Find: {{first_party_name_ar}} → Replace: {{1.first_party_name_ar}}
3. Find: {{first_party_crn}} → Replace: {{1.first_party_crn}}
4. Find: {{second_party_name_ar}} → Replace: {{1.second_party_name_ar}}
5. Find: {{second_party_crn}} → Replace: {{1.second_party_crn}}
6. Find: {{promoter_name_ar}} → Replace: {{1.promoter_name_ar}}
7. Find: {{id_card_number}} → Replace: {{1.id_card_number}}
8. Find: {{contract_start_date}} → Replace: {{1.contract_start_date}}
9. Find: {{contract_end_date}} → Replace: {{1.contract_end_date}}
10. Find: {{first_party_name_en}} → Replace: {{1.first_party_name_en}}
11. Find: {{second_party_name_en}} → Replace: {{1.second_party_name_en}}
12. Find: {{promoter_name_en}} → Replace: {{1.promoter_name_en}}
```

### **Step 3: Test Text Replacements**

1. Save the module
2. Click "Run once"
3. Generate a contract in your app
4. Check if text replacements work
5. ✅ Once text works perfectly, move to Phase 2

---

## **🎯 PHASE 2: Add Image Replacements (AFTER TEXT WORKS)**

### **Option A: Check for Simple Image Module**

1. Click **"+"** to add a module after your text replacement module
2. Search: **"Google Docs"**
3. Look for: **"Replace Image in a Document"** or **"Replace All Images"**

**If you find it:**

```yaml
Module: Google Docs → Replace Image in a Document

Connection: My Google connection
Document ID: { { previous_module.id } }

Images to Replace:
  Item 1:
    Image to Replace: image_1
    New Image URL: { { 1.promoter_id_card_url } }

  Item 2:
    Image to Replace: image_2
    New Image URL: { { 1.promoter_passport_url } }
```

**If you DON'T find it:** Use Option B below.

---

### **Option B: Use API Call for Images**

If there's no simple image replacement module:

#### **Step 1: Find Image Object IDs**

First, add a temporary module to inspect the document:

```yaml
Module: Google Docs → Get a Document

Connection: My Google connection
Document ID: { { previous_module.id } }
```

Run scenario once, then check this module's output for `inlineObjects` section.

You'll find IDs like:

- `"kix.abc123"` for image_1
- `"kix.def456"` for image_2

**Note these IDs!**

#### **Step 2: Add API Call Module**

```yaml
Module: Google Docs → Make an API Call

Connection: My Google connection
URL: /v1/documents/{{previous_module.id}}:batchUpdate
Method: POST

Headers:
  Content-Type: application/json

Body: (see below)
```

#### **Step 3: Configure Body (JSON)**

In Body field, paste this (replace `kix.abc123` with your actual IDs):

```json
{
  "requests": [
    {
      "replaceImage": {
        "imageObjectId": "kix.abc123",
        "uri": "{{1.promoter_id_card_url}}",
        "imageReplaceMethod": "CENTER_CROP"
      }
    },
    {
      "replaceImage": {
        "imageObjectId": "kix.def456",
        "uri": "{{1.promoter_passport_url}}",
        "imageReplaceMethod": "CENTER_CROP"
      }
    }
  ]
}
```

---

## **🎬 Complete Scenario Flow**

Your final Make.com scenario should look like:

```
┌─────────────────────────────────────┐
│ [1] Custom Webhook                  │
│     Receives contract data          │
│     Status: ✓                       │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ [2] Google Docs                     │
│     Replace Text in a Document      │
│     Replaces 12 text fields         │
│     Status: ✓                       │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ [3] Google Docs                     │
│     Replace Image (or API Call)     │
│     Replaces 2 images               │
│     Status: ✓                       │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ [4] Google Drive (Optional)         │
│     Move to specific folder         │
│     Status: ✓                       │
└─────────────────────────────────────┘
```

---

## **📊 Data Flow Verification**

### **Module 1 Output Should Include:**

```json
{
  "contract_id": "...",
  "ref_number": "PAC-2025-001",
  "contract_number": "PAC-2025-001",
  "first_party_name_en": "United Electronics Company",
  "first_party_name_ar": "شركة الإلكترونيات المتحدة",
  "first_party_crn": "1234567",
  "second_party_name_en": "Vendor Company",
  "second_party_name_ar": "شركة المورد",
  "second_party_crn": "7654321",
  "promoter_name_en": "John Doe",
  "promoter_name_ar": "جون دو",
  "id_card_number": "123456789",
  "promoter_id_card_number": "123456789",
  "contract_start_date": "2025-01-01",
  "contract_end_date": "2025-12-31",
  "promoter_id_card_url": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/john_doe_123456789.png",
  "promoter_passport_url": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/john_doe_a1234567.png"
}
```

### **Verify Image URLs:**

Before testing, check if image URLs work:

1. Copy `promoter_id_card_url` from Module 1 output
2. Paste in browser
3. Should show the ID card image
4. Same for passport URL

---

## **✅ Success Checklist**

### **Phase 1 - Text (Must complete first):**

- ☐ Template has all 12 text placeholders
- ☐ Make.com module configured with 12 text items
- ☐ "Map" toggle is OFF
- ☐ Module saved
- ☐ Tested with "Run once"
- ☐ Generated document has all text replaced
- ☐ No {{placeholders}} remain in document

### **Phase 2 - Images (After text works):**

- ☐ Template has 2 placeholder images
- ☐ Images have Alt text set (image_1, image_2)
- ☐ Image replacement module added
- ☐ Image URLs verified in browser
- ☐ Tested with "Run once"
- ☐ Generated document has real ID and passport photos
- ☐ Images are properly sized and positioned

---

## **🚨 Troubleshooting**

### **Text not replacing:**

- Check spelling: `{{first_party_name_ar}}` vs `{{firstPartyNameAr}}`
- Verify "Map" toggle is OFF
- Check Module 1 output has the field

### **[object Object] error:**

- Turn OFF "Map" toggle
- Delete module and create fresh

### **Images not replacing:**

- Verify URLs work in browser
- Check Alt text is exactly `image_1` and `image_2`
- Verify object IDs are correct (for API method)

### **Empty image URLs:**

- Check promoter has both ID and passport URLs in database
- Run the SQL scripts to populate missing URLs
- Verify storage bucket is public

---

## **📁 Supporting Documentation**

I've created these detailed guides:

1. **`MAKECOM_CONFIG_FOR_YOUR_TEMPLATE.md`** - Text replacement setup
2. **`TEMPLATE_IMAGE_SETUP_GUIDE.md`** - How to add images to template
3. **`MAKECOM_IMAGE_MODULE_CONFIG.md`** - Image replacement options
4. **`COMPLETE_MAKECOM_SETUP_WITH_IMAGES.md`** - This file (complete guide)

---

## **🎯 Recommended Approach**

### **Today: Focus on Text**

1. Configure the 12 text replacements
2. Test thoroughly
3. Verify all text works perfectly

### **Tomorrow: Add Images**

1. Add placeholder images to template
2. Set Alt text
3. Configure image replacement module
4. Test with real data

**Reason:** Text is simpler and must work first. Images depend on text working correctly!

---

## **🚀 Quick Start Commands**

### **To deploy latest backend changes:**

```bash
cd C:\Users\HP\Documents\GitHub\Contract-Management-System
git pull
```

Your backend already has:

- ✅ Correct template ID
- ✅ All field aliases (ref_number, id_card_number)
- ✅ Image URLs included in webhook payload
- ✅ All party data fetching

### **To test image URLs manually:**

Run this query in Supabase SQL Editor:

```sql
SELECT
  name_en,
  id_card_url,
  passport_url
FROM promoters
WHERE id_card_url IS NOT NULL
  AND passport_url IS NOT NULL
LIMIT 5;
```

Use one of these promoters for testing!

---

**Start with Phase 1 (text). Once that works perfectly, we'll add images in Phase 2!** 🎯
