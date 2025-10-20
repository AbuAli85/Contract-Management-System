# Production Google Docs Setup Guide

## 🚨 **500 Error Troubleshooting**

If you're getting a 500 Internal Server Error from `/api/contracts/google-docs-generate`, follow these steps:

## 🔍 **Step 1: Check Configuration**

Visit this URL to check your configuration:

```
https://portal.thesmartpro.io/api/debug/google-docs-config
```

This will show you:

- ✅ Which environment variables are set
- ✅ If the service account key is valid
- ✅ If the Google Docs service can be initialized
- ✅ Specific error messages

## 🔧 **Step 2: Set Environment Variables in Production**

### **Vercel (Recommended)**

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-cert-url","universe_domain":"googleapis.com"}

GOOGLE_DOCS_TEMPLATE_ID=your-template-document-id-here

GOOGLE_DRIVE_OUTPUT_FOLDER_ID=your-output-folder-id-here
```

### **Other Hosting Platforms**

- **Netlify**: Site settings → Environment variables
- **Railway**: Project → Variables
- **DigitalOcean**: App Platform → Settings → Environment

## 📝 **Step 3: Create Google Docs Template**

### **3.1 Create Template**

1. Go to [Google Docs](https://docs.google.com/document/create)
2. Create a template with placeholders:

```
EMPLOYMENT CONTRACT

Contract Number: {{contract_number}}
Date: {{contract_date}}

BETWEEN:
{{first_party_name_en}} ({{first_party_name_ar}}) - CLIENT
Commercial Registration: {{first_party_crn}}
Email: {{first_party_email}}

AND:
{{second_party_name_en}} ({{second_party_name_ar}}) - EMPLOYER
Commercial Registration: {{second_party_crn}}
Email: {{second_party_email}}

EMPLOYEE:
{{promoter_name_en}} ({{promoter_name_ar}})
ID Card: {{promoter_id_card_number}}
Mobile: {{promoter_mobile_number}}

CONTRACT DETAILS:
Position: {{job_title}}
Department: {{department}}
Salary: {{basic_salary}} {{currency}}

DOCUMENTS:
ID Card: {{promoter_id_card_image}}
Passport: {{promoter_passport_image}}
```

### **3.2 Share Template**

1. Click **Share** in Google Docs
2. Add: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
3. Set permission to **Editor**

### **3.3 Get Template ID**

1. Copy document ID from URL: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
2. Update `GOOGLE_DOCS_TEMPLATE_ID` in your production environment

## 🔧 **Step 4: Enable Google APIs**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `nth-segment-475411-g1`
3. Go to **APIs & Services** → **Library**
4. Enable:
   - **Google Docs API**
   - **Google Drive API**

## 🧪 **Step 5: Test Configuration**

### **Test Endpoint:**

```
https://portal.thesmartpro.io/api/debug/google-docs-config
```

### **Expected Response:**

```json
{
  "status": "success",
  "environment": {
    "GOOGLE_SERVICE_ACCOUNT_KEY": {
      "exists": true,
      "length": 2000,
      "startsWith": "{\"type\":\"service_account\""
    },
    "GOOGLE_DOCS_TEMPLATE_ID": {
      "exists": true,
      "value": "your-template-id"
    }
  },
  "serviceAccount": {
    "valid": true,
    "error": null
  },
  "googleDocsService": {
    "valid": true,
    "error": null
  }
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Google Docs configuration missing"**

**Solution:** Environment variables not set in production

- Add `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_DOCS_TEMPLATE_ID` to your hosting platform

### **Issue 2: "Template not found"**

**Solution:** Template not shared with service account

- Share template with: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
- Set permission to **Editor**

### **Issue 3: "Permission denied"**

**Solution:** Google APIs not enabled

- Enable Google Docs API and Google Drive API in Google Cloud Console

### **Issue 4: "Invalid credentials"**

**Solution:** Service account key format issue

- Ensure the JSON is properly formatted with escaped quotes
- Check that all required fields are present

## 🔄 **Step 6: Redeploy**

After setting environment variables:

1. **Vercel**: Automatic redeploy
2. **Netlify**: Trigger new deploy
3. **Other platforms**: Redeploy your application

## ✅ **Step 7: Test Full Integration**

```bash
curl -X POST https://portal.thesmartpro.io/api/contracts/google-docs-generate \
  -H "Content-Type: application/json" \
  -d '{
    "promoter_id": "your-promoter-id",
    "first_party_id": "your-client-id",
    "second_party_id": "your-employer-id",
    "contract_type": "full-time-permanent",
    "job_title": "Software Engineer",
    "department": "IT",
    "work_location": "Muscat, Oman",
    "basic_salary": 1500,
    "contract_start_date": "2024-01-01",
    "contract_end_date": "2025-01-01"
  }'
```

## 🎉 **Success Indicators**

✅ **Configuration Check:** `/api/debug/google-docs-config` returns success
✅ **API Response:** Contract generation returns document and PDF links
✅ **Google Drive:** New document created with replaced placeholders
✅ **Frontend:** Green success message with working links

## 🆘 **Still Having Issues?**

1. **Check logs** in your hosting platform
2. **Verify environment variables** are set correctly
3. **Test locally** first with the same environment variables
4. **Contact support** with the debug endpoint response

**Your Google Docs integration should be working in production after these steps!** 🚀
