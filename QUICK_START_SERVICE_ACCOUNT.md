# Quick Start - Service Account Setup
## For: contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com

---

## ✅ **What You've Done So Far**

- ✅ Created Google Cloud project: `nth-segment-475411-g1`
- ✅ Created service account: `contract-generator`
- ✅ Service account email: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`

---

## 📋 **What You Need to Do Now**

### **Step 1: Download JSON Key (if not done)**

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=nth-segment-475411-g1
2. Click on `contract-generator`
3. Go to "Keys" tab
4. If no key exists:
   - Click "Add Key" → "Create new key"
   - Type: JSON
   - Click "Create"
   - Save the downloaded file

---

### **Step 2: Share Template with Service Account**

1. **Open template:**
   https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit

2. **Click "Share"**

3. **Add this email:**
   ```
   contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com
   ```

4. **Permission:** Editor

5. **Uncheck:** "Notify people"

6. **Click "Share"**

---

### **Step 3: Add JSON Key to .env.local**

1. **Open the downloaded JSON file**

2. **Copy ENTIRE content**

3. **Create/edit `.env.local` in project root:**

```env
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"nth-segment-475411-g1",...}'

# Template ID
GOOGLE_DOCS_TEMPLATE_ID=1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

**IMPORTANT:** 
- Wrap JSON in single quotes `'...'`
- Keep on ONE line
- Include entire JSON content

---

### **Step 4: Restart Dev Server**

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

---

### **Step 5: Test**

**Visit:** http://localhost:3000/api/test-google-sa

**Expected result:**
```json
{
  "success": true,
  "message": "✅ Contract generated successfully!",
  "result": {
    "documentId": "1abc...",
    "documentUrl": "https://docs.google.com/document/d/...",
    "pdfUrl": "https://docs.google.com/document/.../export?format=pdf"
  }
}
```

**If successful:**
- ✅ Open the `documentUrl` to see the generated contract
- ✅ All {{placeholders}} should be replaced with data
- ✅ Contract is ready!

---

## 🚨 **Troubleshooting**

### **Error: "Invalid JWT Signature"**
- JSON key is malformed
- Check `.env.local` has correct JSON
- Make sure private_key has `\n` (not actual line breaks)

### **Error: "Insufficient Permission" or "403"**
- Template not shared with service account
- Go back to Step 2 and share the template

### **Error: "File not found"**
- Wrong template ID
- Verify: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`

### **Error: "The caller does not have permission"**
- APIs not enabled
- Enable: Google Docs API and Google Drive API
- https://console.cloud.google.com/apis/library?project=nth-segment-475411-g1

---

## 🎯 **After Testing Works**

Once the test endpoint works:

1. **Integrate into your contract generation flow**
2. **Update your contract generation API** to use `googleDocsServiceSA`
3. **Remove Make.com dependency**
4. **Celebrate!** 🎉

---

## 📞 **Need Help?**

If you get stuck, share:
1. The error message you see
2. Which step you're on
3. Screenshot if helpful

---

## ✅ **Complete Checklist**

- ☐ Downloaded JSON key
- ☐ Shared template with service account
- ☐ Added key to `.env.local`
- ☐ Restarted dev server
- ☐ Tested endpoint
- ☐ Saw success message
- ☐ Opened generated document
- ☐ Verified placeholders replaced

**When all checked:** You're done! 🚀

