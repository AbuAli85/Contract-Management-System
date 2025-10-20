# 🚀 Personal Google Drive Setup - No Premium Plan Required

## 💡 **Solution: Use Your Personal Google Drive**

Since Google Drive requires a premium plan for service accounts, we'll use your personal Google Drive (200GB) instead.

## 🔧 **Simple Setup Steps**

### **Step 1: Create Template in Your Personal Drive**

1. **Go to Google Docs**: https://docs.google.com/document/create
2. **Create your contract template** with these placeholders:

```
EMPLOYMENT CONTRACT

Contract Number: {{contract_number}}
Date: {{contract_date}}

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
Mobile: {{promoter_mobile_number}}
Email: {{promoter_email}}

CONTRACT DETAILS:
Position: {{job_title}}
Department: {{department}}
Work Location: {{work_location}}
Basic Salary: {{basic_salary}} {{currency}}
Start Date: {{contract_start_date}}
End Date: {{contract_end_date}}

SPECIAL TERMS:
{{special_terms}}
```

3. **Save the document**
4. **Copy the document ID** from the URL: `https://docs.google.com/document/d/DOCUMENT_ID/edit`

### **Step 2: Share Template with Service Account**

1. **In your template, click "Share"**
2. **Add this email**: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
3. **Set permission to "Editor"**
4. **Click "Send"**

### **Step 3: Update Environment Variable**

Update this in your production environment:

```env
GOOGLE_DOCS_TEMPLATE_ID=your-document-id-from-personal-drive
```

**Keep the existing service account key** - no need to change it.

## 🧪 **Test the Setup**

### **Step 1: Test Configuration**

```
https://portal.thesmartpro.io/api/debug/google-docs-config
```

### **Step 2: Test Integration**

```
https://portal.thesmartpro.io/api/test/google-docs-simple
```

## 🎯 **Expected Results**

After setup, you should see:

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

## 📋 **Complete Placeholder List**

Use these placeholders in your template:

### **Contract Info**

- `{{contract_number}}` - Contract number
- `{{contract_date}}` - Contract date
- `{{contract_type}}` - Contract type

### **Client (First Party)**

- `{{first_party_name_en}}` - Client name (English)
- `{{first_party_name_ar}}` - Client name (Arabic)
- `{{first_party_crn}}` - Client CRN
- `{{first_party_email}}` - Client email
- `{{first_party_phone}}` - Client phone

### **Employer (Second Party)**

- `{{second_party_name_en}}` - Employer name (English)
- `{{second_party_name_ar}}` - Employer name (Arabic)
- `{{second_party_crn}}` - Employer CRN
- `{{second_party_email}}` - Employer email
- `{{second_party_phone}}` - Employer phone

### **Promoter**

- `{{promoter_name_en}}` - Promoter name (English)
- `{{promoter_name_ar}}` - Promoter name (Arabic)
- `{{promoter_email}}` - Promoter email
- `{{promoter_mobile_number}}` - Mobile number
- `{{promoter_id_card_number}}` - ID card number
- `{{promoter_passport_number}}` - Passport number

### **Contract Details**

- `{{job_title}}` - Job title
- `{{department}}` - Department
- `{{work_location}}` - Work location
- `{{basic_salary}}` - Basic salary
- `{{currency}}` - Currency (OMR)
- `{{contract_start_date}}` - Start date
- `{{contract_end_date}}` - End date
- `{{special_terms}}` - Special terms

## 🎉 **Benefits of This Solution**

✅ **No premium plan required**  
✅ **Uses your 200GB personal storage**  
✅ **No additional costs**  
✅ **Full contract generation functionality**  
✅ **Documents saved to your personal drive**  
✅ **Easy to manage and organize**

## 🚀 **How It Works**

1. **Template stays in your personal drive** (200GB available)
2. **Service account accesses template** via sharing
3. **New documents created in your personal drive**
4. **No service account storage limitations**

## 📊 **Summary**

- **Issue**: Google Drive premium plan required for service accounts
- **Solution**: Use personal Google Drive (200GB)
- **Cost**: $0/month
- **Result**: Full functionality without premium plans

**Your Google Docs integration will work perfectly with your existing 200GB storage!** 🎉

---

**Status**: ✅ READY FOR IMPLEMENTATION
**Cost**: ✅ $0/MONTH
**Storage**: ✅ 200GB AVAILABLE
**Premium Plan**: ✅ NOT REQUIRED
