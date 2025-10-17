# 🔧 Enable Google APIs for Service Account

## 🔴 **Current Error:**
```
Method doesn't allow unregistered callers (callers without established identity).
Please use API Key or other form of API consumer identity to call this API.
```

**This means:** Google Drive API and/or Google Docs API are not enabled in your Google Cloud Project.

---

## ✅ **SOLUTION: Enable Both APIs**

### **Step 1: Enable Google Drive API**

1. **Click this link:**
   https://console.cloud.google.com/apis/library/drive.googleapis.com?project=nth-segment-475411-g1

2. **Click the "ENABLE" button** (big blue button)

3. **Wait for it to enable** (takes a few seconds)

---

### **Step 2: Enable Google Docs API**

1. **Click this link:**
   https://console.cloud.google.com/apis/library/docs.googleapis.com?project=nth-segment-475411-g1

2. **Click the "ENABLE" button**

3. **Wait for it to enable**

---

### **Step 3: Verify APIs Are Enabled**

After enabling both APIs, you can verify they're active:

**Enabled APIs Dashboard:**
https://console.cloud.google.com/apis/dashboard?project=nth-segment-475411-g1

You should see:
- ✓ Google Drive API
- ✓ Google Docs API

---

## 🧪 **Step 4: Test Again**

After enabling the APIs, run the test script again:

```bash
node scripts/test-service-account.js
```

**Expected output:**
```
✅ Service account key found
✅ Credentials parsed successfully
✅ JWT client created
✅ Template found!
✅ Template copied successfully!
✅ Text replacement successful!

🎉 ALL TESTS PASSED!
```

---

## ⚠️ **Alternative: Enable APIs Manually**

If the direct links don't work:

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/library?project=nth-segment-475411-g1

2. **Search for "Google Drive API"**
   - Click on it
   - Click "Enable"

3. **Search for "Google Docs API"**
   - Click on it
   - Click "Enable"

---

## 🔍 **Troubleshooting**

### **If you see "Enable Billing" error:**
- Your Google Cloud Project needs billing enabled
- Go to: https://console.cloud.google.com/billing?project=nth-segment-475411-g1
- Add a billing account (free tier is usually enough)

### **If you see "Permission Denied":**
- You might not be the owner of the GCP project
- Contact the project owner to enable the APIs

### **If APIs are already enabled:**
- Wait 1-2 minutes for changes to propagate
- Try running the test script again

---

## 📋 **Summary**

**What you need to do RIGHT NOW:**

1. ✅ **Enable Google Drive API:** https://console.cloud.google.com/apis/library/drive.googleapis.com?project=nth-segment-475411-g1

2. ✅ **Enable Google Docs API:** https://console.cloud.google.com/apis/library/docs.googleapis.com?project=nth-segment-475411-g1

3. ✅ **Test:** `node scripts/test-service-account.js`

4. ✅ **Share template** (after APIs work):
   - Open: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit
   - Share with: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
   - Permission: Editor

---

**🎯 Once the APIs are enabled, everything should work!**

