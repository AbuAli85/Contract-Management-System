# Google Docs Template - Image Setup Guide

## For ID Card and Passport Photos

---

## **🎯 How to Add Image Placeholders in Your Template**

Your template needs 2 image placeholders:

1. **ID Card Photo** (بطاقة)
2. **Passport Photo** (جواز السفر)

---

## **Method 1: Using Alt Text (RECOMMENDED)**

This is the easiest method that works with Make.com.

### **Step 1: Open Your Template**

URL: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit

### **Step 2: Insert Placeholder Images**

1. **For ID Card:**
   - In your template, go to where you want the ID card image
   - Click **Insert → Image → Upload from computer**
   - Upload any placeholder image (e.g., a grey 200x200px square)
   - The image will be inserted

2. **For Passport:**
   - Same process for passport image location
   - Upload another placeholder image

### **Step 3: Add Alt Text to Each Image**

This is CRITICAL for Make.com to find and replace the images.

**For ID Card Image:**

1. Right-click the ID card placeholder image
2. Select **"Alt text"**
3. In the **Title** field, enter exactly: `image_1`
4. In the **Description** field, enter: `Promoter ID Card`
5. Click **Save**

**For Passport Image:**

1. Right-click the passport placeholder image
2. Select **"Alt text"**
3. In the **Title** field, enter exactly: `image_2`
4. In the **Description** field, enter: `Promoter Passport`
5. Click **Save**

---

## **Method 2: Using Inline Placeholders**

If Method 1 doesn't work, you can use text placeholders that we'll replace with images.

### **In Your Template:**

Instead of inserting images, insert text placeholders:

```
**ID Card Photo:**
{{id_card_image}}

**Passport Photo:**
{{passport_image}}
```

We'll replace these text placeholders with actual images using a different approach.

---

## **🎯 Recommended Layout in Template**

```
Ref: {{ref_number}}

عقد عمل بائع
Promoter Assignment Contract

[... contract text ...]

الفاضل: {{promoter_name_ar}} (الموظف)
بطاقة رقم: {{id_card_number}}

صورة البطاقة / ID Card Photo:
[Insert placeholder image here - Alt text: image_1]

صورة الجواز / Passport Photo:
[Insert placeholder image here - Alt text: image_2]

تاريخ الالتحاق: {{contract_start_date}} وحتى {{contract_end_date}}

[... rest of contract ...]
```

---

## **✅ Verification Checklist**

Before proceeding to Make.com configuration:

- ☐ Template has 2 placeholder images inserted
- ☐ ID card image has Alt text "Title" = `image_1`
- ☐ Passport image has Alt text "Title" = `image_2`
- ☐ Images are positioned where you want the final images
- ☐ Images are reasonably sized (200x200px to 400x400px recommended)
- ☐ Template is saved

---

## **🔍 How to Check Alt Text**

To verify Alt text is set correctly:

1. Click on the image in your template
2. Right-click → **Alt text**
3. You should see:
   - Title: `image_1` (or `image_2`)
   - Description: Can be anything

If not set, add it now!

---

## **📸 Image Size Recommendations**

For best results:

- **ID Card Photo:** 300x200px (landscape)
- **Passport Photo:** 300x400px (portrait)
- **Format:** PNG or JPEG
- **File size:** Under 2MB each

The actual images from your database will be resized to fit these dimensions.

---

## **🚨 Common Issues**

### **Issue: Images are too small in generated document**

- Solution: Make placeholder images larger in template

### **Issue: Images are distorted**

- Solution: Match aspect ratio of placeholder to actual images

### **Issue: Make.com can't find images to replace**

- Solution: Verify Alt text is set exactly as `image_1` and `image_2`

### **Issue: Images don't appear at all**

- Solution: Check that image URLs are publicly accessible

---

## **Next Steps**

After setting up images in template:

1. ✅ Save the template
2. ✅ Note the exact position/location of images
3. ✅ Configure Make.com image replacement module
4. ✅ Test with real data

See `MAKECOM_IMAGE_MODULE_CONFIG.md` for Make.com configuration!
