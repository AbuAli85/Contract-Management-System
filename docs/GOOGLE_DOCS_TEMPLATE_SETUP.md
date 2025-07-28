# 🔧 Google Docs Template Setup Guide - Fix Template Reading Issues

## 🎯 **Problem Identified**
The contract form is not properly reading the Google Docs templates and the generated contract doesn't match what's configured. This is because:

1. **Template IDs are not properly configured** in the contract type configuration
2. **Make.com integration is not properly set up** to use the templates
3. **Template placeholders are not correctly formatted** for Make.com compatibility

## ✅ **Solution: Complete Template Setup**

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

#### **1.2 Add Image Placeholders (Optional)**
If you want to include ID card and passport images:

1. **Insert** → **Image** → **Upload from computer** (any placeholder image)
2. **Right-click** the image → **Alt text**
3. **Set Alt text to**: `ID_CARD_IMAGE` (exactly this text)
4. **Repeat** for passport image with Alt text: `PASSPORT_IMAGE`

### **Step 2: Update Contract Type Configuration**

#### **2.1 Update Template IDs**
Edit `lib/contract-type-config.ts` and update the template IDs:

```typescript
export const enhancedContractTypes: ContractTypeConfig[] = [
  {
    id: 'oman-unlimited-contract',
    name: 'Oman Unlimited Employment Contract',
    description: 'Standard unlimited duration employment contract',
    category: 'employment',
    googleDocsTemplateId: 'YOUR_ACTUAL_TEMPLATE_ID_HERE', // Replace with your template ID
    makecomTemplateId: 'oman-unlimited-contract-template',
    isActive: true,
    requiresApproval: true,
    // ... rest of configuration
  },
  // ... other contract types
]
```

#### **2.2 Get Your Template ID**
1. **Open your Google Docs template**
2. **Copy the ID** from the URL: `https://docs.google.com/document/d/[YOUR_TEMPLATE_ID]/edit`
3. **Replace** `YOUR_ACTUAL_TEMPLATE_ID_HERE` with your actual template ID

### **Step 3: Configure Make.com Integration**

#### **3.1 Environment Variables**
Add to your `.env.local`:

```bash
# Make.com Integration
MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-id
MAKECOM_API_KEY=your-makecom-api-key

# Google Drive/Docs
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

#### **3.2 Make.com Scenario Setup**

**Module 1: Webhook Trigger**
```json
{
  "webhook": {
    "type": "custom",
    "url": "https://your-domain.com/api/webhook/makecom",
    "method": "POST"
  }
}
```

**Module 2: HTTP Request (Get Contract Data)**
```json
{
  "http": {
    "url": "https://your-domain.com/api/webhook/makecom",
    "method": "POST",
    "body": {
      "contract_id": "{{1.contract_id}}",
      "contract_number": "{{1.contract_number}}",
      "contract_type": "{{1.contract_type}}"
    }
  }
}
```

**Module 3: Google Docs (Create from Template)**
```json
{
  "google_docs": {
    "operation": "create_document_from_template",
    "template_id": "{{2.data.template_config.google_docs_template_id}}",
    "variables": {
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
  }
}
```

**Module 4: Google Docs (Export as PDF)**
```json
{
  "google_docs": {
    "operation": "export_document",
    "document_id": "{{3.document_id}}",
    "format": "pdf"
  }
}
```

**Module 5: Supabase (Upload PDF)**
```json
{
  "supabase": {
    "operation": "upload_file",
    "bucket": "contracts",
    "file_data": "{{4.data}}",
    "file_name": "{{2.data.data.contract_number}}.pdf"
  }
}
```

**Module 6: HTTP Request (Update Contract)**
```json
{
  "http": {
    "url": "https://your-domain.com/api/webhook/contract-pdf-ready",
    "method": "POST",
    "body": {
      "contract_id": "{{1.contract_id}}",
      "pdf_url": "{{5.url}}",
      "status": "generated"
    }
  }
}
```

### **Step 4: Test the Integration**

#### **4.1 Test Template Data**
1. **Navigate to**: `/api/webhook/makecom`
2. **Send a test request** with:
```json
{
  "contract_id": "test-contract-id",
  "contract_number": "PAC-01012024-TEST",
  "contract_type": "oman-unlimited-contract"
}
```

#### **4.2 Test Contract Generation**
1. **Go to**: `/generate-contract`
2. **Select** "Oman Unlimited Employment Contract"
3. **Fill in** the form with test data
4. **Submit** and check if Make.com is triggered

### **Step 5: Verify Template Reading**

#### **5.1 Check Logs**
Look for these log messages:
```
🔗 Make.com webhook received
📋 Contract data fetched: { id: "...", type: "oman-unlimited-contract" }
✅ Template data prepared: { contract_number: "...", template_id: "..." }
```

#### **5.2 Check Make.com Execution**
1. **Open Make.com scenario**
2. **Check execution history**
3. **Verify** Google Docs module receives correct template ID
4. **Confirm** document is created from template

## 🔧 **Troubleshooting**

### **Issue: Template Not Found**
**Error**: `Template not found` or `Invalid template ID`

**Solution**:
1. **Verify template ID** in `lib/contract-type-config.ts`
2. **Check** Google Docs template exists and is accessible
3. **Ensure** Make.com has access to the template

### **Issue: Placeholders Not Replaced**
**Error**: Placeholders show as `{{placeholder_name}}` in generated document

**Solution**:
1. **Check** placeholder names match exactly
2. **Verify** Make.com variable mapping
3. **Test** with simple placeholders first

### **Issue: Make.com Not Triggered**
**Error**: No webhook execution in Make.com

**Solution**:
1. **Check** `MAKE_WEBHOOK_URL` environment variable
2. **Verify** webhook URL is correct
3. **Test** webhook endpoint manually

## ✅ **Expected Result**

After proper setup:
1. ✅ **Contract form** reads template configuration correctly
2. ✅ **Make.com** receives contract data with template ID
3. ✅ **Google Docs** creates document from template
4. ✅ **PDF** is generated with all placeholders replaced
5. ✅ **Contract** is updated with PDF URL

## 📋 **Template Placeholder Reference**

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{contract_number}}` | Unique contract identifier | `PAC-01012024-ABC1` |
| `{{contract_date}}` | Contract signing date | `01/01/2024` |
| `{{first_party_name_en}}` | Client company name (English) | `ABC Company Ltd` |
| `{{first_party_name_ar}}` | Client company name (Arabic) | `شركة ABC المحدودة` |
| `{{second_party_name_en}}` | Employer company name (English) | `XYZ Corporation` |
| `{{second_party_name_ar}}` | Employer company name (Arabic) | `شركة XYZ` |
| `{{promoter_name_en}}` | Employee name (English) | `John Doe` |
| `{{promoter_name_ar}}` | Employee name (Arabic) | `جون دو` |
| `{{job_title}}` | Position title | `Software Developer` |
| `{{department}}` | Department/division | `IT Department` |
| `{{work_location}}` | Primary work location | `Muscat, Oman` |
| `{{contract_start_date}}` | Start date (DD/MM/YYYY) | `01/01/2024` |
| `{{contract_end_date}}` | End date (DD/MM/YYYY) | `31/12/2024` |
| `{{basic_salary}}` | Monthly basic salary | `1000` |
| `{{allowances}}` | Monthly allowances | `200` |
| `{{currency}}` | Currency code | `OMR` |
| `{{total_salary}}` | Total monthly compensation | `1200` |
| `{{special_terms}}` | Special terms and conditions | `As per company policy` |

This setup will ensure that your contract form properly reads the Google Docs templates and generates contracts that match your configuration! 