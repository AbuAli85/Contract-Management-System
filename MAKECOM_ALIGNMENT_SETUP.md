# 🔧 Make.com Alignment Setup Guide

## 🎯 **Current System Overview**

Your contract management system has multiple generation methods:

1. **Google Docs Direct Integration** (Primary)
2. **HTML Template Engine** (Fallback)
3. **Simple PDF Generation** (Fallback)
4. **Make.com Integration** (Backup)

## 📋 **Step 1: Environment Variables Setup**

### **1.1 Update Your .env.local File**

Add these Make.com-specific environment variables:

```bash
# ========================================
# 🔗 MAKE.COM INTEGRATION
# ========================================

# Main Contract Generation Webhook
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_CONTRACT_GENERATION_WEBHOOK_ID
NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_CONTRACT_GENERATION_WEBHOOK_ID

# PDF Ready Notification Webhook
PDF_READY_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_PDF_READY_WEBHOOK_ID
NEXT_PUBLIC_PDF_READY_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_PDF_READY_WEBHOOK_ID

# Make.com Webhook Security
MAKE_WEBHOOK_SECRET=your_webhook_secret_here

# Contract Type Specific Webhooks
MAKE_WEBHOOK_EMPLOYMENT=https://hook.eu2.make.com/YOUR_EMPLOYMENT_WEBHOOK_ID
MAKE_WEBHOOK_SERVICE=https://hook.eu2.make.com/YOUR_SERVICE_WEBHOOK_ID
MAKE_WEBHOOK_FREELANCE=https://hook.eu2.make.com/YOUR_FREELANCE_WEBHOOK_ID

# Google Drive Integration (for Make.com)
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
GOOGLE_DOCS_TEMPLATE_ID=your_google_docs_template_id
```

## 🏗️ **Step 2: Create Make.com Scenarios**

### **2.1 Main Contract Generation Scenario**

#### **Scenario Name**: "Contract Generation Workflow"

**Modules Setup:**

1. **Webhook Trigger**
   - **Module**: Webhooks → Custom webhook
   - **Method**: POST
   - **Response**: JSON
   - **Copy the webhook URL** to your environment variables

2. **Data Processing**
   - **Module**: Tools → Set multiple variables
   - **Variables**:
     ```
     contract_id: {{1.contract_id}}
     contract_number: {{1.contract_number}}
     contract_type: {{1.contract_type}}
     promoter_id: {{1.promoter_id}}
     first_party_id: {{1.first_party_id}}
     second_party_id: {{1.second_party_id}}
     ```

3. **Google Docs - Create from Template**
   - **Module**: Google Docs → Create a document from template
   - **Template ID**: Use your Google Docs template ID
   - **Variables Mapping**:
     ```json
     {
       "contract_number": "{{2.contract_number}}",
       "contract_date": "{{1.contract_date}}",
       "first_party_name_en": "{{1.first_party_name_en}}",
       "first_party_name_ar": "{{1.first_party_name_ar}}",
       "first_party_crn": "{{1.first_party_crn}}",
       "second_party_name_en": "{{1.second_party_name_en}}",
       "second_party_name_ar": "{{1.second_party_name_ar}}",
       "second_party_crn": "{{1.second_party_crn}}",
       "promoter_name_en": "{{1.promoter_name_en}}",
       "promoter_name_ar": "{{1.promoter_name_ar}}",
       "promoter_id_card_number": "{{1.promoter_id_card_number}}",
       "job_title": "{{1.job_title}}",
       "department": "{{1.department}}",
       "work_location": "{{1.work_location}}",
       "contract_start_date": "{{1.contract_start_date}}",
       "contract_end_date": "{{1.contract_end_date}}",
       "basic_salary": "{{1.basic_salary}}",
       "currency": "{{1.currency}}",
       "special_terms": "{{1.special_terms}}"
     }
     ```

4. **Google Docs - Export as PDF**
   - **Module**: Google Docs → Export a document
   - **Document ID**: `{{3.document_id}}`
   - **Format**: PDF

5. **Supabase - Upload PDF**
   - **Module**: Supabase → Upload a file
   - **Connection**: Your Supabase connection
   - **Bucket**: `contracts`
   - **File data**: `{{4.data}}`
   - **File name**: `{{2.contract_number}}.pdf`

6. **HTTP Request - Update Contract Status**
   - **Module**: HTTP → Make an HTTP request
   - **URL**: `https://portal.thesmartpro.io/api/contracts/update-status`
   - **Method**: PATCH
   - **Headers**:
     ```
     Content-Type: application/json
     Authorization: Bearer {{your_api_token}}
     ```
   - **Body**:
     ```json
     {
       "contract_id": "{{2.contract_id}}",
       "status": "completed",
       "document_url": "{{3.document_url}}",
       "pdf_url": "{{5.url}}",
       "generated_at": "{{now}}"
     }
     ```

### **2.2 PDF Ready Notification Scenario**

#### **Scenario Name**: "PDF Ready Notification"

**Modules Setup:**

1. **Webhook Trigger**
   - **Module**: Webhooks → Custom webhook
   - **Method**: POST
   - **Response**: JSON

2. **Email Notification**
   - **Module**: Email → Send an email
   - **To**: `{{1.recipient_email}}`
   - **Subject**: `Contract {{1.contract_number}} is Ready`
   - **Body**:

     ```
     Dear {{1.recipient_name}},

     Your contract {{1.contract_number}} has been generated and is ready for review.

     Document URL: {{1.document_url}}
     PDF URL: {{1.pdf_url}}

     Best regards,
     Contract Management System
     ```

## 🔧 **Step 3: Update Contract Type Configuration**

### **3.1 Update lib/contract-type-config.ts**

```typescript
export const enhancedContractTypes: ContractTypeConfig[] = [
  {
    id: 'full-time-permanent',
    name: 'Full-Time Permanent Employment',
    nameAr: 'توظيف دائم بدوام كامل',
    // ... other properties
    makecomTemplateId: 'YOUR_MAKECOM_TEMPLATE_ID',
    googleDocsTemplateId: 'YOUR_GOOGLE_DOCS_TEMPLATE_ID',
    // ... rest of configuration
  },
  {
    id: 'part-time-employment',
    name: 'Part-Time Employment',
    nameAr: 'توظيف بدوام جزئي',
    // ... other properties
    makecomTemplateId: 'YOUR_MAKECOM_TEMPLATE_ID',
    googleDocsTemplateId: 'YOUR_GOOGLE_DOCS_TEMPLATE_ID',
    // ... rest of configuration
  },
  // ... other contract types
];
```

## 🧪 **Step 4: Testing Your Setup**

### **4.1 Test Webhook Connectivity**

```bash
# Test main webhook
curl -X POST https://hook.eu2.make.com/YOUR_CONTRACT_GENERATION_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "test-001",
    "contract_number": "TEST-001",
    "contract_type": "full-time-permanent",
    "promoter_id": "test-promoter",
    "first_party_id": "test-client",
    "second_party_id": "test-employer",
    "job_title": "Software Developer",
    "department": "IT",
    "work_location": "Remote",
    "basic_salary": 1000,
    "currency": "OMR",
    "contract_start_date": "2024-01-01",
    "contract_end_date": "2024-12-31",
    "special_terms": "Test contract"
  }'
```

### **4.2 Test Contract Generation**

1. **Go to**: https://portal.thesmartpro.io/simple-contract
2. **Fill out the form** with test data
3. **Click "Generate Contract"**
4. **Check Make.com scenario execution**
5. **Verify PDF generation and upload**

## 🔍 **Step 5: Monitoring and Debugging**

### **5.1 Make.com Logs**

- **Go to**: Make.com → Scenarios → Your Scenario → History
- **Check**: Execution logs for errors
- **Monitor**: Success/failure rates

### **5.2 Application Logs**

- **Check**: Browser console for errors
- **Monitor**: Network requests to Make.com
- **Verify**: Webhook responses

### **5.3 Common Issues and Solutions**

| Issue                 | Solution                                   |
| --------------------- | ------------------------------------------ |
| 404 Webhook Error     | Check webhook URL in environment variables |
| Template Not Found    | Verify Google Docs template ID             |
| Authentication Error  | Check Google Docs API credentials          |
| Upload Failed         | Verify Supabase connection and permissions |
| PDF Generation Failed | Check Google Docs export permissions       |

## 📊 **Step 6: Performance Optimization**

### **6.1 Scenario Optimization**

- **Enable**: Error handling in Make.com scenarios
- **Set**: Retry logic for failed operations
- **Configure**: Timeout settings appropriately
- **Monitor**: Execution times and optimize

### **6.2 Fallback Strategy**

Your system already has multiple fallback methods:

1. **Primary**: Google Docs Direct Integration
2. **Fallback 1**: HTML Template Engine
3. **Fallback 2**: Simple PDF Generation
4. **Backup**: Make.com Integration

## 🎯 **Expected Results**

After completing this setup:

✅ **Make.com Integration**: Properly configured and aligned
✅ **Webhook Processing**: Automatic contract generation
✅ **Template Processing**: Google Docs templates with placeholders
✅ **PDF Generation**: Automatic PDF creation and upload
✅ **Status Updates**: Real-time contract status updates
✅ **Notifications**: Email notifications when contracts are ready
✅ **Fallback Support**: Multiple generation methods available

## 📋 **Final Checklist**

- [ ] Environment variables updated
- [ ] Make.com scenarios created and activated
- [ ] Webhook URLs configured
- [ ] Google Docs templates created
- [ ] Contract type configuration updated
- [ ] Webhook connectivity tested
- [ ] Contract generation tested
- [ ] PDF upload verified
- [ ] Email notifications working
- [ ] Error handling configured
- [ ] Monitoring setup complete

## 🚀 **Next Steps**

1. **Follow this guide** step by step
2. **Create your Make.com scenarios** as described
3. **Update environment variables** with your actual webhook URLs
4. **Test the complete workflow**
5. **Monitor and optimize** performance
6. **Set up error alerts** for production monitoring

This setup will align your Make.com integration with your current contract management system and provide robust fallback mechanisms for reliable contract generation!
