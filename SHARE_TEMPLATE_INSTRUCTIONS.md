# 📋 How to Share Google Docs Template with Service Account

## ⚠️ CRITICAL STEP - Do This Now!

Your Service Account **CANNOT** access the template until you share it!

---

## 🎯 **STEP-BY-STEP INSTRUCTIONS:**

### **1. Open Your Template**
- **Link:** https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit
- Click the link above or paste it in your browser

### **2. Click the "Share" Button**
- Look in the **top-right corner** of Google Docs
- It's a blue button that says "Share" or has a person icon

### **3. Add the Service Account Email**

**Copy this email address EXACTLY:**
```
contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com
```

**Paste it in the "Add people and groups" field**

### **4. Set Permission to "Editor"**
- Click the dropdown next to the email (it says "Viewer" by default)
- Change it to **"Editor"**
- This is REQUIRED - the service account needs to copy/edit the document

### **5. Uncheck "Notify people"**
- At the bottom, there's a checkbox "Notify people"
- **UNCHECK** this (service accounts don't receive emails)

### **6. Click "Done"**

---

## ✅ **Verification**

After sharing, the template's share settings should show:
- ✓ Your personal email (Owner)
- ✓ `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com` (Editor)

---

## 🧪 **Test It**

After sharing:
1. **Restart your dev server** (if needed):
   ```bash
   npm run dev
   ```

2. **Open test endpoint:**
   ```
   http://localhost:3000/api/test-google-sa
   ```

3. **Expected result:**
   ```json
   {
     "success": true,
     "message": "✅ Contract generated successfully!",
     "result": {
       "documentId": "...",
       "documentUrl": "https://docs.google.com/document/d/.../edit",
       "pdfUrl": "https://docs.google.com/document/d/.../export?format=pdf"
     }
   }
   ```

---

## ❌ **Still Getting Errors?**

### **Error: "Failed to copy template"**
- Template NOT shared yet → Go back to Step 2 above
- Wrong email → Make sure you used the EXACT email (copy-paste it)
- Wrong permission → Make sure it's "Editor", not "Viewer"

### **Error: "GOOGLE_SERVICE_ACCOUNT_KEY is not defined"**
- `.env.local` not created → Run `node setup-env-now.js` again
- Dev server not restarted → Stop server (Ctrl+C) and run `npm run dev`

### **Error: "The caller does not have permission"**
- Google Docs API not enabled → Go to https://console.cloud.google.com/apis/library?project=nth-segment-475411-g1
  - Search "Google Docs API" → Click → Enable
  - Search "Google Drive API" → Click → Enable

---

## 📸 **Visual Guide**

**What the Share dialog looks like:**

```
┌─────────────────────────────────────────┐
│ Share "Employment Contract Template"    │
├─────────────────────────────────────────┤
│ Add people and groups                   │
│ ┌─────────────────────────────────────┐ │
│ │ contract-generator@nth-segment...   │ │
│ └─────────────────────────────────────┘ │
│                            [Editor ▼]    │
│                                          │
│ People with access                       │
│ ✓ you@gmail.com (Owner)                │
│ ✓ contract-generator@... (Editor)      │
│                                          │
│ ☐ Notify people                         │
│                      [Cancel]  [Done]    │
└─────────────────────────────────────────┘
```

---

## 🚀 **After Success**

Once the test endpoint works, you can:
1. Integrate this into your actual contract generation flow
2. Replace any Make.com contract generation with this backend service
3. Deploy to production (remember to use Base64 encoding for the key)

---

**🎯 Main takeaway: The OAuth error you saw is from OLD code. We're using Service Accounts now, which is much simpler!**

