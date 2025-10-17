# Google Docs Direct Integration Setup Guide

## 🎯 **Direct Google Docs Integration (No Make.com Required)**

This guide shows how to set up direct Google Docs integration for contract generation with placeholder replacement and image insertion.

## 📋 **Prerequisites**

1. **Google Cloud Project** with Google Docs API and Google Drive API enabled
2. **Service Account** with proper permissions
3. **Google Docs Template** with placeholders
4. **Environment Variables** configured

## 🔧 **Step 1: Google Cloud Setup**

### **1.1 Enable APIs**
```bash
# Enable required APIs in Google Cloud Console
- Google Docs API
- Google Drive API
```

### **1.2 Create Service Account**
1. Go to **Google Cloud Console** → **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `contract-generator`
4. Description: `Service account for contract generation`
5. Click **Create and Continue**

### **1.3 Grant Permissions**
```json
{
  "roles": [
    "roles/documents.editor",
    "roles/drive.file"
  ]
}
```

### **1.4 Generate Service Account Key**
1. Click on the service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Choose **JSON** format
5. Download the key file

## 🔧 **Step 2: Environment Variables**

Add these to your `.env.local` file:

```env
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"contract-generator@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-cert-url"}'

# Google Docs Template
GOOGLE_DOCS_TEMPLATE_ID=your-template-document-id

# Google Drive Output Folder (Optional)
GOOGLE_DRIVE_OUTPUT_FOLDER_ID=your-output-folder-id
```

## 📝 **Step 3: Create Google Docs Template**

### **3.1 Template Structure**

Create a Google Docs template with these placeholders:

```
EMPLOYMENT CONTRACT

Contract Number: {{contract_number}}
Date: {{contract_date}}
Type: {{contract_type}}

BETWEEN:
{{first_party_name_en}} ({{first_party_name_ar}}) - CLIENT
Commercial Registration: {{first_party_crn}}
Email: {{first_party_email}}
Phone: {{first_party_phone}}

AND:
{{second_party_name_en}} ({{second_party_name_ar}}) - EMPLOYER
Commercial Registration: {{second_party_crn}}
Email: {{second_party_email}}
Phone: {{second_party_phone}}

EMPLOYEE:
{{promoter_name_en}} ({{promoter_name_ar}})
ID Card Number: {{promoter_id_card_number}}
Passport Number: {{promoter_passport_number}}
Mobile: {{promoter_mobile_number}}
Email: {{promoter_email}}

CONTRACT DETAILS:
Position: {{job_title}}
Department: {{department}}
Work Location: {{work_location}}
Start Date: {{contract_start_date}}
End Date: {{contract_end_date}}
Basic Salary: {{basic_salary}} {{currency}}

SPECIAL TERMS:
{{special_terms}}

DOCUMENTS:
ID Card: {{promoter_id_card_image}}
Passport: {{promoter_passport_image}}

[Add your contract terms and conditions here...]
```

### **3.2 Image Placeholders**

For image placeholders, use:
- `{{promoter_id_card_image}}` - Will be replaced with ID card image
- `{{promoter_passport_image}}` - Will be replaced with passport image

### **3.3 Share Template**

1. **Share the template** with your service account email
2. **Grant Editor permission** to the service account
3. **Copy the document ID** from the URL

## 🔧 **Step 4: API Integration**

### **4.1 Available Endpoints**

```typescript
// Generate contract with Google Docs
POST /api/contracts/google-docs-generate

// Request body
{
  "promoter_id": "uuid",
  "first_party_id": "uuid", 
  "second_party_id": "uuid",
  "contract_type": "full-time-permanent",
  "job_title": "Software Engineer",
  "department": "IT",
  "work_location": "Muscat, Oman",
  "basic_salary": 1500,
  "contract_start_date": "2024-01-01",
  "contract_end_date": "2025-01-01",
  "special_terms": "Remote work allowed"
}

// Response
{
  "success": true,
  "message": "Contract generated successfully",
  "data": {
    "contract_id": "uuid",
    "contract_number": "CON-1234567890",
    "document_id": "google-docs-id",
    "document_url": "https://docs.google.com/document/d/.../edit",
    "pdf_url": "https://drive.google.com/file/d/.../view",
    "generated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🎨 **Step 5: Features**

### **✅ Text Placeholder Replacement**
- All `{{placeholder}}` text is replaced with actual data
- Case-insensitive matching
- Supports all contract data fields

### **✅ Image Replacement**
- ID card images automatically inserted
- Passport images automatically inserted
- Images uploaded to Google Drive
- Proper sizing and formatting

### **✅ PDF Generation**
- Automatic PDF creation
- Public access links
- Stored in Google Drive

### **✅ Document Management**
- New document created for each contract
- Timestamped naming
- Organized in output folder

## 🔄 **Step 6: Workflow**

```
1. User fills contract form
2. System validates data
3. Google Docs template copied
4. Text placeholders replaced
5. Images uploaded and inserted
6. PDF generated
7. Links returned to user
```

## 🚀 **Step 7: Testing**

### **7.1 Test Template**
1. Create a simple test template
2. Add basic placeholders
3. Test with sample data

### **7.2 Test API**
```bash
curl -X POST http://localhost:3000/api/contracts/google-docs-generate \
  -H "Content-Type: application/json" \
  -d '{
    "promoter_id": "test-id",
    "first_party_id": "client-id",
    "second_party_id": "employer-id",
    "contract_type": "full-time-permanent",
    "job_title": "Test Engineer",
    "department": "Testing",
    "work_location": "Test Location",
    "basic_salary": 1000,
    "contract_start_date": "2024-01-01",
    "contract_end_date": "2024-12-31"
  }'
```

## 🔧 **Step 8: Troubleshooting**

### **Common Issues:**

1. **Service Account Permissions**
   - Ensure service account has access to template
   - Check Google Drive permissions

2. **Template Not Found**
   - Verify template ID is correct
   - Check template is shared with service account

3. **Image Upload Fails**
   - Check image URLs are accessible
   - Verify Google Drive API permissions

4. **Placeholder Not Replaced**
   - Check placeholder spelling
   - Ensure exact `{{placeholder}}` format

## 📊 **Step 9: Monitoring**

### **Logs to Monitor:**
- Google API quota usage
- Document generation success rate
- Image upload failures
- PDF generation errors

### **Metrics to Track:**
- Contracts generated per day
- Average generation time
- Error rates by type

## ✅ **Benefits of Direct Integration**

1. **🚀 No External Dependencies** - No Make.com or third-party tools
2. **⚡ Faster Processing** - Direct API calls
3. **🔒 Better Security** - Direct Google authentication
4. **💰 Cost Effective** - No Make.com subscription needed
5. **🎯 Full Control** - Complete customization possible
6. **📱 Real-time Results** - Immediate document generation

## 🎉 **Ready to Use!**

Your Google Docs direct integration is now ready for production use with:
- ✅ Template-based contract generation
- ✅ Automatic placeholder replacement
- ✅ Image insertion (ID cards, passports)
- ✅ PDF generation
- ✅ Google Drive storage
- ✅ Real-time API responses

**Start generating professional contracts directly with Google Docs!** 🚀
