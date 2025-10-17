# Make.com - Image Replacement Module Configuration
## For Google Docs Template with Images

---

## **Why Images Need a Separate Module**

Google Docs API requires a different approach for images:
- Text replacements use `replaceAllText` API
- Image replacements use `replaceImage` API or image insertion
- Make.com's "Replace Text" module doesn't handle images

---

## **Solution: Add "Make an API Call" Module**

After your text replacement module, add:

**Module Type:** Google Docs → Make an API Call

---

## **Configuration**

### **Basic Settings:**

```yaml
Connection: My Google connection
URL: /v1/documents/{{6.id}}:batchUpdate
Method: POST
```

### **Headers:**

Click "Add item" and add:
```
Key: Content-Type
Value: application/json
```

### **Body:**

Switch to "Raw" mode and paste this JSON:

```json
{
  "requests": [
    {
      "replaceImage": {
        "imageObjectId": "{{image_1_object_id}}",
        "uri": "{{1.promoter_id_card_url}}",
        "imageReplaceMethod": "CENTER_CROP"
      }
    },
    {
      "replaceImage": {
        "imageObjectId": "{{image_2_object_id}}",
        "uri": "{{1.promoter_passport_url}}",
        "imageReplaceMethod": "CENTER_CROP"
      }
    }
  ]
}
```

---

## **⚠️ Problem: Finding Image Object IDs**

The challenge: You need the **exact object IDs** of the images in your template.

### **How to Get Image Object IDs:**

1. **Add a module BEFORE the image replacement:**
   - Module: **Google Docs → Get a Document**
   - Document ID: `{{6.id}}` (or your template ID)

2. **Run the scenario once**

3. **Check the output** - look for `inlineObjects` which will show IDs like:
   ```json
   {
     "inlineObjects": {
       "kix.abc123": { ... },
       "kix.def456": { ... }
     }
   }
   ```

4. **Use those IDs** in the replaceImage requests

---

## **🎯 EASIER SOLUTION: Use Alternative Approach**

Since finding object IDs is complex, here's a simpler workflow:

### **Option 1: Skip Images in Make.com**

For now, get text replacements working first:
1. Text replacement module creates the contract
2. Images can be added manually later
3. Or added via a different process

### **Option 2: Use Named Ranges**

In your Google Docs template:
1. Select each image placeholder
2. Right-click → **Define named range**
3. Name it: `promoter_id_card`, `promoter_passport`, etc.
4. Use this API call instead:

```json
{
  "requests": [
    {
      "deleteContentRange": {
        "range": {
          "segmentId": "",
          "startIndex": "{{promoter_id_card_start}}",
          "endIndex": "{{promoter_id_card_end}}"
        }
      }
    },
    {
      "insertInlineImage": {
        "uri": "{{1.promoter_id_card_url}}",
        "location": {
          "segmentId": "",
          "index": "{{promoter_id_card_start}}"
        },
        "objectSize": {
          "height": {
            "magnitude": 200,
            "unit": "PT"
          },
          "width": {
            "magnitude": 200,
            "unit": "PT"
          }
        }
      }
    }
  ]
}
```

This is still complex!

---

## **🎯 RECOMMENDED: Two-Step Approach**

### **Phase 1: Get Text Working (NOW)**

1. Use only the text replacement module
2. Template will have placeholder images (not replaced)
3. Contract is still usable

### **Phase 2: Add Images (LATER)**

1. After text works perfectly
2. Research proper image replacement method
3. OR handle images in your backend before sending to Make.com
4. OR use a different Google Docs library that handles images better

---

## **Alternative: Handle Images in Backend**

Instead of Make.com handling images, your backend could:

1. **Create the Google Doc** with all text and images
2. **Send only the final document URL** to Make.com
3. Make.com just stores it in Drive or converts to PDF

This is more reliable than trying to replace images in Make.com!

---

## **Current Recommendation**

For now, focus on:
- ✅ Text replacements working perfectly
- ✅ Contract generation completing
- ⏸️ Skip images temporarily
- 🔜 Add images later once text flow works

The 40+ placeholder URLs we added in the backend ensure empty image fields won't break the process.

