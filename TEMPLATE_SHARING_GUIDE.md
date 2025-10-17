# 🔗 Template Sharing Guide - Critical Step

## 🚨 **Current Issue**
The Google Docs integration is failing because the template needs to be shared with the service account. The error message indicates that the service account cannot access your template.

## 🎯 **Solution: Share Your Template**

### **Step 1: Open Your Template**
Go to your template: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit

### **Step 2: Share with Service Account**

#### **Method 1: Using Share Button**
1. **Click the blue "Share" button** in the top-right corner
2. **In the "Add people and groups" field**, enter:
   ```
   contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com
   ```
3. **Set permission to "Editor"** (not Viewer)
4. **Uncheck "Notify people"** (since it's a service account)
5. **Click "Share"**

#### **Method 2: Using Three Dots Menu**
1. **Click the three dots menu** (⋮) in the top-right
2. **Select "Share & export"**
3. **Click "Share"**
4. **Follow the same steps as Method 1**

### **Step 3: Verify Sharing**
After sharing, you should see the service account email in the "People with access" section with "Editor" permission.

## 🧪 **Test After Sharing**

Once you've shared the template, test the integration:

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

## 📋 **Template Content Requirements**

Make sure your template includes these placeholders:

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

## 🔧 **Why This is Critical**

The service account needs **Editor** access to:
- ✅ Copy the template
- ✅ Replace placeholders with actual data
- ✅ Insert images (ID cards, passports)
- ✅ Generate the final contract
- ✅ Create new documents in your personal drive

## 🚀 **Benefits After Sharing**

Once shared successfully:
- ✅ **No premium plan required**
- ✅ **Uses your 200GB personal storage**
- ✅ **Full contract generation functionality**
- ✅ **Documents saved to your personal drive**
- ✅ **No service account storage limitations**

## 🆘 **Troubleshooting**

### **If Share Button is Not Visible:**
1. Make sure you're the owner of the document
2. Try refreshing the page
3. Use the three dots menu (⋮) → "Share & export" → "Share"

### **If Permission is Denied:**
1. Ensure you're using the correct email: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
2. Set permission to "Editor" (not Viewer)
3. Make sure the document is not restricted by your organization

### **If Still Getting Quota Error:**
1. Verify the template is in your personal Google Drive (not a shared drive)
2. Check that you have 200GB of storage available
3. Ensure the service account has Editor access

## 📞 **Next Steps**

1. **Share the template** with the service account
2. **Test the integration** using the curl command above
3. **Verify success** with the expected JSON response
4. **Start generating contracts** using the Simple Contract Generator

---

**This is the final step to get your Google Docs integration working perfectly!** 🎯
