# 📋 Production Setup Checklist for Google Service Account

Use this checklist to ensure everything is configured correctly for production.

---

## ✅ **Step 1: Environment Variables in Production**

### **Check if variables are set:**

- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` is added to production environment
- [ ] `GOOGLE_DOCS_TEMPLATE_ID` is added to production environment
- [ ] Production site has been **redeployed** after adding variables

### **How to verify:**

**For Vercel:**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. You should see both variables listed

**For Railway/Netlify/Other:**
- Check your platform's environment variables section
- Both variables should be present

---

## ✅ **Step 2: Google Cloud APIs Enabled**

- [ ] Google Drive API is enabled
- [ ] Google Docs API is enabled

### **How to check:**

1. **Go to:** https://console.cloud.google.com/apis/dashboard?project=nth-segment-475411-g1

2. **You should see these in the enabled APIs list:**
   - Google Drive API
   - Google Docs API

### **If not enabled:**

**Enable Google Drive API:**
- https://console.cloud.google.com/apis/library/drive.googleapis.com?project=nth-segment-475411-g1
- Click "ENABLE"

**Enable Google Docs API:**
- https://console.cloud.google.com/apis/library/docs.googleapis.com?project=nth-segment-475411-g1
- Click "ENABLE"

---

## ✅ **Step 3: Template Shared with Service Account**

- [ ] Template is shared with service account email
- [ ] Permission is set to "Editor" (not Viewer)

### **How to check:**

1. **Open template:** https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit

2. **Click "Share" button** (top-right)

3. **Look for this email in the shared list:**
   ```
   contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com
   ```

4. **Check permission:** Should say "Editor"

### **If not shared:**

1. Click "Share" button
2. Add: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
3. Set to "Editor"
4. Uncheck "Notify people"
5. Click "Done"

---

## ✅ **Step 4: Production Deployment**

- [ ] Latest code is deployed to production
- [ ] Deployment includes the new error diagnostics

### **How to verify:**

**For Vercel:**
1. Go to: https://vercel.com/dashboard/deployments
2. Latest deployment should include commit: `feat: add detailed error diagnostics`
3. If not, trigger a redeploy

**For other platforms:**
- Make sure your latest GitHub push is deployed
- Check deployment logs for any errors

---

## 🧪 **Step 5: Test Production Endpoint**

After completing all steps above, test the endpoint:

**URL:** https://portal.thesmartpro.io/api/test-google-sa

### **Expected Success Response:**

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

### **If you get an error:**

The new error response will now include detailed diagnostics:

```json
{
  "success": false,
  "error": "Detailed error message here",
  "errorDetails": {
    "status": 403,
    "code": "forbidden",
    "message": "Specific reason for failure"
  },
  "troubleshooting": {
    "service_account_email": "contract-generator@...",
    "template_id": "...",
    "template_url": "..."
  }
}
```

**Common error codes:**

- **403 Forbidden:** Template not shared with service account → Go to Step 3
- **404 Not Found:** Wrong template ID or template doesn't exist
- **401 Unauthorized:** Service account credentials invalid or not set → Go to Step 1
- **400 Bad Request:** API not enabled → Go to Step 2

---

## 🔍 **Troubleshooting Specific Errors**

### **Error: "Missing Google Service Account credentials"**

**Solution:**
- Environment variables not set in production
- Go back to Step 1
- Make sure you used `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` (not just `GOOGLE_SERVICE_ACCOUNT_KEY`)
- Redeploy after adding variables

### **Error: "The caller does not have permission"**

**Solution:**
- Google Drive API or Google Docs API not enabled
- Go to Step 2
- Enable both APIs
- Wait 1-2 minutes for changes to propagate

### **Error: "File not found" or "Requested entity was not found"**

**Solution:**
- Template not shared with service account
- Go to Step 3
- Make sure you share with the EXACT email (copy-paste it)
- Make sure permission is "Editor"

### **Error: "Invalid JWT Signature"**

**Solution:**
- Service account key is malformed or incorrect
- Regenerate the Base64 key:
  ```bash
  node scripts/generate-production-env.js
  ```
- Copy the new Base64 string
- Update production environment variable
- Redeploy

---

## 📝 **Quick Reference**

**Service Account Email:**
```
contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com
```

**Template ID:**
```
1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

**Template URL:**
```
https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit
```

**Google Cloud Console:**
```
https://console.cloud.google.com/apis/dashboard?project=nth-segment-475411-g1
```

**Production Test Endpoint:**
```
https://portal.thesmartpro.io/api/test-google-sa
```

---

## 🎯 **After Everything Works**

Once the test endpoint returns success:

1. ✅ Your production is fully configured
2. ✅ You can now generate contracts in production
3. ✅ No more Make.com restrictions
4. ✅ Full control over contract generation

---

**Need help?** Share the error message with `errorDetails` from the test endpoint!

