# 🔧 Make.com Integration Setup Guide - Fix Template Reading Issues

## 🎯 **Current Issues Identified**

### **1. Wrong Webhook URL** ❌

- **Problem**: `MAKE_WEBHOOK_URL` is set to placeholder: `YOUR_NEW_CONTRACT_GENERATION_WEBHOOK_ID`
- **Result**: 404 Not Found errors
- **Status**: ❌ **NEEDS FIX**

### **2. Placeholder Template IDs** ❌

- **Problem**: All contract types have placeholder Google Docs template IDs
- **Result**: System can't find actual templates
- **Status**: ❌ **NEEDS FIX**

### **3. Missing Make.com Scenario** ❌

- **Problem**: No Make.com scenario processes the webhook
- **Result**: Nothing handles contract generation requests
- **Status**: ❌ **NEEDS FIX**

## ✅ **Complete Solution**

### **Step 1: Create Google Docs Templates**

#### **1.1 Create Employment Contract Template**

1. **Go to**: https://docs.google.com/document/create
2. **Create a new document** with this structure:

```
EMPLOYMENT CONTRACT

Contract Number: {{contract_number}}
Date: {{contract_date}}

BETWEEN:
{{first_party_name_en}} ({{first_party_name_ar}})
Commercial Registration: {{first_party_crn}}
Address: {{first_party_address_en}}
Contact Person: {{first_party_contact_person}}
Email: {{first_party_contact_email}}
Phone: {{first_party_contact_phone}}

AND:
{{second_party_name_en}} ({{second_party_name_ar}})
Commercial Registration: {{second_party_crn}}
Address: {{second_party_address_en}}
Contact Person: {{second_party_contact_person}}
Email: {{second_party_contact_email}}
Phone: {{second_party_contact_phone}}

EMPLOYEE:
{{promoter_name_en}} ({{promoter_name_ar}})
ID Card Number: {{promoter_id_card_number}}
Mobile: {{promoter_mobile_number}}
Email: {{promoter_email}}

CONTRACT DETAILS:
Position: {{job_title}}
Department: {{department}}
Work Location: {{work_location}}
Start Date: {{contract_start_date}}
End Date: {{contract_end_date}}
Basic Salary: {{basic_salary}} {{currency}}
Allowances: {{allowances}} {{currency}}
Total Salary: {{total_salary}} {{currency}}

SPECIAL TERMS:
{{special_terms}}

[Add your contract terms and conditions here...]
```

3. **Save the document** and copy the **Document ID** from the URL
4. **Document ID format**: `https://docs.google.com/document/d/[DOCUMENT_ID]/edit`

#### **1.2 Create Service Contract Template**

1. **Create another document** for service contracts
2. **Use similar structure** but adapt for service agreements
3. **Copy the Document ID**

### **Step 2: Set Up Make.com Scenario**

#### **2.1 Create New Scenario**

1. **Go to**: https://www.make.com/
2. **Sign in** to your account
3. **Click**: "Create a new scenario"
4. **Name it**: "Contract Generation Workflow"

#### **2.2 Add Webhook Trigger**

1. **Add module**: "Webhooks" → "Custom webhook"
2. **Configure**:
   - **URL**: Copy the webhook URL provided
   - **Method**: POST
   - **Response**: JSON
3. **Save** and copy the webhook URL

#### **2.3 Add HTTP Request (Get Contract Data)**

1. **Add module**: "HTTP" → "Make an HTTP request"
2. **Configure**:
   - **URL**: `https://your-domain.com/api/webhook/makecom`
   - **Method**: POST
   - **Body**: JSON
   ```json
   {
     "contract_id": "{{1.contract_id}}",
     "contract_number": "{{1.contract_number}}",
     "contract_type": "{{1.contract_type}}"
   }
   ```

#### **2.4 Add Google Docs (Create from Template)**

1. **Add module**: "Google Docs" → "Create a document from template"
2. **Configure**:
   - **Template ID**: `{{2.data.template_config.google_docs_template_id}}`
   - **Variables**: Map all the template placeholders
   ```json
   {
     "contract_number": "{{2.data.data.contract_number}}",
     "contract_date": "{{2.data.data.contract_date}}",
     "first_party_name_en": "{{2.data.data.first_party_name_en}}",
     "first_party_name_ar": "{{2.data.data.first_party_name_ar}}",
     "first_party_crn": "{{2.data.data.first_party_crn}}",
     "second_party_name_en": "{{2.data.data.second_party_name_en}}",
     "second_party_name_ar": "{{2.data.data.second_party_name_ar}}",
     "second_party_crn": "{{2.data.data.second_party_crn}}",
     "promoter_name_en": "{{2.data.data.promoter_name_en}}",
     "promoter_name_ar": "{{2.data.data.promoter_name_ar}}",
     "promoter_id_card_number": "{{2.data.data.promoter_id_card_number}}",
     "job_title": "{{2.data.data.job_title}}",
     "department": "{{2.data.data.department}}",
     "work_location": "{{2.data.data.work_location}}",
     "contract_start_date": "{{2.data.data.contract_start_date}}",
     "contract_end_date": "{{2.data.data.contract_end_date}}",
     "basic_salary": "{{2.data.data.basic_salary}}",
     "allowances": "{{2.data.data.allowances}}",
     "currency": "{{2.data.data.currency}}",
     "total_salary": "{{2.data.data.total_salary}}",
     "special_terms": "{{2.data.data.special_terms}}"
   }
   ```

#### **2.5 Add Google Docs (Export as PDF)**

1. **Add module**: "Google Docs" → "Export a document"
2. **Configure**:
   - **Document ID**: `{{3.document_id}}`
   - **Format**: PDF

#### **2.6 Add Supabase (Upload PDF)**

1. **Add module**: "Supabase" → "Upload a file"
2. **Configure**:
   - **Connection**: Your Supabase connection
   - **Bucket**: `contracts`
   - **File data**: `{{4.data}}`
   - **File name**: `{{2.data.data.contract_number}}.pdf`

#### **2.7 Add HTTP Request (Update Contract Status)**

1. **Add module**: "HTTP" → "Make an HTTP request"
2. **Configure**:
   - **URL**: `https://your-domain.com/api/contracts/generate`
   - **Method**: PATCH
   - **Body**: JSON
   ```json
   {
     "contract_id": "{{1.contract_id}}",
     "action": "update_pdf",
     "pdf_url": "{{5.url}}",
     "google_drive_url": "{{3.document_url}}"
   }
   ```

#### **2.8 Save and Activate**

1. **Save** the scenario
2. **Activate** it
3. **Copy** the webhook URL

### **Step 3: Update Environment Variables**

#### **3.1 Update .env.local**

```bash
# Main contract generation webhook (NEW)
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_NEW_CONTRACT_GENERATION_WEBHOOK_ID
NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_NEW_CONTRACT_GENERATION_WEBHOOK_ID

# PDF ready notification webhook (KEEP EXISTING)
PDF_READY_WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
NEXT_PUBLIC_PDF_READY_WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4

# Google Drive folder for storing contracts
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

### **Step 4: Update Contract Type Configuration**

#### **4.1 Update Template IDs**

Edit `lib/contract-type-config.ts`:

```typescript
export const enhancedContractTypes: ContractTypeConfig[] = [
  {
    id: "full-time-permanent",
    name: "Full-Time Permanent Employment",
    // ... other properties
    makecomTemplateId: "YOUR_ACTUAL_MAKECOM_TEMPLATE_ID",
    googleDocsTemplateId: "YOUR_ACTUAL_GOOGLE_DOCS_TEMPLATE_ID",
    // ... rest of configuration
  },
  // ... other contract types
]
```

#### **4.2 Replace Placeholder IDs**

- Replace `YOUR_ACTUAL_MAKECOM_TEMPLATE_ID` with your Make.com template ID
- Replace `YOUR_ACTUAL_GOOGLE_DOCS_TEMPLATE_ID` with your Google Docs template ID

### **Step 5: Test the Integration**

#### **5.1 Test Webhook**

```bash
# Test the webhook directly
curl -X POST https://hook.eu2.make.com/YOUR_NEW_CONTRACT_GENERATION_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "test-contract-id",
    "contract_number": "TEST-001",
    "contract_type": "full-time-permanent"
  }'
```

#### **5.2 Test Contract Generation**

1. **Go to** your application
2. **Generate a new contract**
3. **Check** Make.com scenario execution
4. **Verify** PDF generation and upload

### **Step 6: Troubleshooting**

#### **6.1 Common Issues**

- **404 Error**: Webhook URL is incorrect
- **Template Not Found**: Google Docs template ID is wrong
- **Authentication Error**: Google Docs API not configured
- **Upload Failed**: Supabase connection issues

#### **6.2 Debug Steps**

1. **Check Make.com logs** for errors
2. **Verify webhook URL** is correct
3. **Test template ID** in Google Docs
4. **Check Supabase connection**
5. **Review application logs**

## 🎯 **Expected Results**

After completing this setup:

✅ **Contract Generation**: Uses Make.com workflow
✅ **Template Processing**: Creates documents from Google Docs templates
✅ **PDF Generation**: Exports contracts as PDF
✅ **File Upload**: Stores PDFs in Supabase storage
✅ **Status Updates**: Updates contract status automatically
✅ **Notifications**: Sends notifications when PDF is ready

## 📋 **Checklist**

- [ ] Create Google Docs templates
- [ ] Set up Make.com scenario
- [ ] Update environment variables
- [ ] Update contract type configuration
- [ ] Test webhook
- [ ] Test contract generation
- [ ] Verify PDF creation
- [ ] Check file upload
- [ ] Confirm status updates

## 🚀 **Next Steps**

1. **Follow the setup guide** step by step
2. **Create the Make.com scenario** as described
3. **Update your environment variables** with the correct webhook URL
4. **Test the complete workflow**
5. **Monitor logs** for any issues

This will fix the template reading issues and enable proper Make.com integration with Google Docs templates!
