# Make.com - Image Replacement Module Configuration
## For ID Card and Passport Photos

---

## **🎯 Overview**

After text replacement works, add a separate module to replace the 2 images:
1. **image_1** → Promoter ID Card
2. **image_2** → Promoter Passport

---

## **📋 Prerequisites**

Before setting up this module:

- ✅ Text replacement module (Module 3) is working
- ✅ Template has 2 placeholder images with Alt text set
- ✅ ID card image has Alt text: `image_1`
- ✅ Passport image has Alt text: `image_2`

---

## **🎯 Option 1: Using "Replace Image in a Document" Module (EASIEST)**

Some Make.com accounts have a dedicated image replacement module.

### **Check if you have this module:**

1. Click **"+"** to add a module after your text replacement module
2. Search for: **"Google Docs"**
3. Look for: **"Replace Image in a Document"** or **"Replace All Images in a Document"**

### **If you see it:**

**Configuration:**

```yaml
Module: Google Docs → Replace Image in a Document

Connection: My Google connection
Document ID: {{3.id}}  (or {{2.id}} if Module 2 was the copy module)

Images to Replace:
  Click "Add item" twice:

Item 1:
  Image to Replace: image_1
  New Image URL: {{1.promoter_id_card_url}}
  
Item 2:
  Image to Replace: image_2
  New Image URL: {{1.promoter_passport_url}}
```

**Done!** This is the simplest approach.

---

## **🎯 Option 2: Using "Make an API Call" Module (ADVANCED)**

If you don't have the simple image replacement module, use the API.

### **Step 1: Find Image Object IDs**

Before you can replace images, you need to find their Object IDs.

**Add a temporary module:**

```yaml
Module: Google Docs → Get a Document

Connection: My Google connection
Document ID: {{3.id}}  (the document from text replacement module)
```

**Run the scenario once**, then:

1. Click on this "Get a Document" module
2. Look at the **Output**
3. Find the section: `inlineObjects`
4. You'll see something like:

```json
{
  "inlineObjects": {
    "kix.r7j8k9m0n1p2": {
      "inlineObjectProperties": {
        "embeddedObject": {
          "imageProperties": {
            "sourceUri": "...",
            "contentUri": "..."
          },
          "title": "image_1",
          "description": "Promoter ID Card"
        }
      }
    },
    "kix.s8t9u0v1w2x3": {
      "inlineObjectProperties": {
        "embeddedObject": {
          "imageProperties": {
            "sourceUri": "...",
            "contentUri": "..."
          },
          "title": "image_2",
          "description": "Promoter Passport"
        }
      }
    }
  }
}
```

5. **Note the IDs:**
   - `image_1` has ID: `kix.r7j8k9m0n1p2` (your ID will be different!)
   - `image_2` has ID: `kix.s8t9u0v1w2x3` (your ID will be different!)

### **Step 2: Add API Call Module**

```yaml
Module: Google Docs → Make an API Call

Connection: My Google connection
URL: /v1/documents/{{3.id}}:batchUpdate
Method: POST

Headers:
  Content-Type: application/json
```

### **Step 3: Configure Body**

In the **Body** field, switch to **"Raw"** mode and paste:

```json
{
  "requests": [
    {
      "replaceImage": {
        "imageObjectId": "kix.r7j8k9m0n1p2",
        "uri": "{{1.promoter_id_card_url}}",
        "imageReplaceMethod": "CENTER_CROP"
      }
    },
    {
      "replaceImage": {
        "imageObjectId": "kix.s8t9u0v1w2x3",
        "uri": "{{1.promoter_passport_url}}",
        "imageReplaceMethod": "CENTER_CROP"
      }
    }
  ]
}
```

**⚠️ CRITICAL:** Replace `kix.r7j8k9m0n1p2` and `kix.s8t9u0v1w2x3` with YOUR actual object IDs from Step 1!

**imageReplaceMethod options:**
- `CENTER_CROP` - Centers and crops to fit
- `CENTER_INSIDE` - Centers without cropping (maintains aspect ratio)

---

## **🎯 Option 3: Dynamic Image Replacement (NO OBJECT IDs NEEDED)**

If finding object IDs is too complex, use this approach that replaces images by Alt text dynamically.

### **Module: Google Apps Script**

This requires creating a small Google Apps Script, but it's more flexible.

**I can help you set this up if Options 1 & 2 don't work!**

---

## **🎯 Option 4: Backend Image Insertion (RECOMMENDED FOR NOW)**

The easiest approach: Let your backend handle image insertion before sending to Make.com.

### **How it works:**

1. Backend fetches promoter data (already done ✅)
2. Backend creates Google Doc with text AND images
3. Backend sends completed document URL to Make.com
4. Make.com just stores/organizes the document

**Advantage:** More reliable, less complex Make.com configuration

---

## **🚀 Recommended Approach: Start with Text Only**

For now, I recommend:

### **Phase 1: Get Text Working (DO THIS FIRST)**
- Configure the 12 text replacements
- Test and verify text replacement works perfectly
- Contracts are usable even without images

### **Phase 2: Add Images (AFTER TEXT WORKS)**
- Try Option 1 (simple Replace Image module) if available
- If not available, try Option 2 (API Call)
- Or consider Option 4 (backend handles images)

---

## **📋 Current Scenario Structure**

### **For Text Only (Phase 1):**

```
[1] Custom Webhook
      ↓
[2] Google Docs → Copy a Document
      ↓
[3] Google Docs → Replace Text in a Document (12 items)
      ↓
[4] (Optional) Google Drive → Move File to Folder
```

### **With Images (Phase 2):**

```
[1] Custom Webhook
      ↓
[2] Google Docs → Copy a Document
      ↓
[3] Google Docs → Replace Text in a Document (12 items)
      ↓
[4] Google Docs → Replace Image (2 images)
      ↓
[5] (Optional) Google Drive → Convert to PDF
      ↓
[6] (Optional) Upload PDF URL back to your database
```

---

## **🧪 Testing Images**

Once image module is configured:

1. **Run scenario with "Run once"**
2. **Generate a contract** for a promoter with both ID and passport URLs
3. **Check Module 1 output** - verify image URLs are present:
   ```json
   {
     "promoter_id_card_url": "https://reootcngcptfogfozlmz.supabase.co/...",
     "promoter_passport_url": "https://reootcngcptfogfozlmz.supabase.co/..."
   }
   ```
4. **Check generated document** - images should be replaced

---

## **✅ Success Criteria**

Images are working when:

- ✅ Module 4 (image replacement) shows green checkmark
- ✅ Opening the generated Google Doc shows actual ID and passport photos
- ✅ No placeholder images remain
- ✅ Images are properly sized and positioned
- ✅ Images load correctly (not broken links)

---

## **🚨 Troubleshooting**

### **Issue: "Image not found" or "Invalid object ID"**
- Object IDs are template-specific and change if template is re-created
- Re-run "Get a Document" module to find new IDs
- Verify Alt text is set correctly

### **Issue: "URL is not accessible"**
- Image URLs must be publicly accessible
- Test by pasting URL in browser - should show image
- Check Supabase storage bucket is public

### **Issue: Images are broken/don't load**
- URLs might have expired or be incorrect
- Check that URLs in Module 1 output are valid HTTPS URLs
- Verify storage bucket RLS policies allow public read

### **Issue: Images replaced but wrong size**
- Use `CENTER_INSIDE` instead of `CENTER_CROP`
- Or adjust placeholder image size in template

---

## **💡 Pro Tip: Verify Image URLs First**

Before testing image replacement, check if URLs work:

1. **Run scenario once**
2. **Click Module 1** (webhook)
3. **Copy the value of `promoter_id_card_url`**
4. **Paste in browser** - you should see the ID card image
5. **Do same for `promoter_passport_url`**

If images don't load in browser, they won't work in Make.com either!

---

## **📞 Need Help?**

If you're stuck on image replacement:

1. **Screenshot the module picker** - show me which Google Docs modules you have
2. **Screenshot Module 1 output** - let me see the image URLs
3. **Try the "Get a Document" approach** - share the inlineObjects output

I can provide exact configuration based on what you have!

---

**For now, focus on getting the 12 text replacements working. Images can be added later!** 🎯

