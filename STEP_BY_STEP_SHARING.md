# 🎯 Step-by-Step Template Sharing Guide

## 🚨 **Current Status**
The Google Docs integration is ready, but the template needs to be shared with the service account. This is the **ONLY** remaining step.

## 📋 **Step-by-Step Instructions**

### **Step 1: Open Your Template**
Click this link: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit

### **Step 2: Find the Share Button**
Look for the **blue "Share" button** in the top-right corner of your Google Doc.

### **Step 3: Click Share**
Click the blue "Share" button.

### **Step 4: Add Service Account Email**
In the "Add people and groups" field, type exactly:
```
contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com
```

### **Step 5: Set Permission**
- Click the dropdown next to the email
- Select **"Editor"** (not Viewer)

### **Step 6: Uncheck Notify**
- Uncheck the "Notify people" checkbox (since it's a service account)

### **Step 7: Click Share**
Click the "Share" button to complete the process.

### **Step 8: Verify**
You should see the service account email in the "People with access" section with "Editor" permission.

## 🧪 **Test After Sharing**

Run this command to test:

```bash
curl -X GET https://portal.thesmartpro.io/api/test/google-docs-simple
```

## 🎉 **Expected Success Result**

After sharing, you should see:

```json
{
  "success": true,
  "message": "Google Docs integration test successful",
  "result": {
    "documentId": "new-document-id",
    "documentUrl": "https://docs.google.com/document/d/.../edit",
    "pdfUrl": "https://drive.google.com/file/d/.../view"
  }
}
```

## 🆘 **Troubleshooting**

### **If Share Button is Not Visible:**
1. **Refresh the page**
2. **Try the three dots menu** (⋮) → "Share & export" → "Share"
3. **Make sure you're the owner** of the document

### **If Permission is Denied:**
1. **Ensure you're using the correct email**: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
2. **Set permission to "Editor"** (not Viewer)
3. **Make sure the document is not restricted** by your organization

### **If Still Getting Quota Error:**
1. **Verify the template is in your personal Google Drive** (not a shared drive)
2. **Check that you have 200GB of storage available**
3. **Ensure the service account has Editor access**

## 🎯 **Why This is Critical**

The service account needs **Editor** access to:
- ✅ Copy the template
- ✅ Replace placeholders with actual data
- ✅ Insert images (ID cards, passports)
- ✅ Generate the final contract
- ✅ Create new documents in your personal drive

## 🚀 **After Sharing Successfully**

Your contract generation will work perfectly with:
- ✅ **Bilingual contracts** (Arabic + English)
- ✅ **Professional formatting**
- ✅ **Automatic image insertion**
- ✅ **PDF generation**
- ✅ **200GB personal storage**
- ✅ **No premium plan required**

## 📞 **Next Steps**

1. **Share the template** with the service account (follow steps above)
2. **Test the integration** using the curl command
3. **Verify success** with the expected JSON response
4. **Start generating contracts** using the Simple Contract Generator

---

**This is the final step! Once you share the template, everything will work perfectly.** 🎯
