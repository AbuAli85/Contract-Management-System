# 🔧 Make.com Webhook Integration - Complete Setup Guide

## 🎯 **Current Status**

- ✅ **Make.com API endpoints**: Implemented and working
- ✅ **Webhook triggering code**: Ready to use
- ❌ **`MAKECOM_WEBHOOK_URL`**: Missing in production environment
- ❌ **Make.com scenario**: Not created yet

## 🛠️ **Step-by-Step Fix**

### **Step 1: Create Make.com Scenario**

#### **1.1 Go to Make.com**
1. Visit [https://www.make.com/](https://www.make.com/)
2. Sign in to your account
3. Click **"Create a new scenario"**

#### **1.2 Add Webhook Trigger**
1. **Search for**: "Webhooks"
2. **Select**: "Custom webhook"
3. **Configure**:
   - **Name**: "Contract Generation Webhook"
   - **Method**: POST
   - **Response**: JSON
4. **Save** and copy the webhook URL

#### **1.3 Add HTTP Request (Get Contract Data)**
1. **Add module**: "HTTP" → "Make an HTTP request"
2. **Configure**:
   - **URL**: `https://portal.thesmartpro.io/api/contracts/makecom/generate`
   - **Method**: POST
   - **Headers**: 
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_API_KEY"
     }
     ```
   - **Body**: 
     ```json
     {
       "contractType": "{{1.contract_type}}",
       "contractData": {
         "promoter_id": "{{1.promoter_id}}",
         "first_party_id": "{{1.first_party_id}}",
         "second_party_id": "{{1.second_party_id}}",
         "job_title": "{{1.job_title}}",
         "department": "{{1.department}}",
         "work_location": "{{1.work_location}}",
         "basic_salary": "{{1.basic_salary}}",
         "contract_start_date": "{{1.contract_start_date}}",
         "contract_end_date": "{{1.contract_end_date}}",
         "special_terms": "{{1.special_terms}}"
       },
       "triggerMakecom": false
     }
     ```

#### **1.4 Add Google Docs (Create Document)**
1. **Add module**: "Google Docs" → "Create a document from template"
2. **Configure**:
   - **Template ID**: `{{2.data.template_config.googleDocsTemplateId}}`
   - **Document Name**: `{{2.data.data.contract_number}}`
   - **Variables**: Map all template placeholders

#### **1.5 Add Google Docs (Export as PDF)**
1. **Add module**: "Google Docs" → "Export a document"
2. **Configure**:
   - **Document ID**: `{{3.document_id}}`
   - **Format**: PDF

#### **1.6 Add Supabase (Upload PDF)**
1. **Add module**: "Supabase" → "Upload a file"
2. **Configure**:
   - **Connection**: Your Supabase connection
   - **Bucket**: `contracts`
   - **File data**: `{{4.data}}`
   - **File name**: `{{2.data.data.contract_number}}.pdf`

#### **1.7 Add HTTP Request (Update Contract)**
1. **Add module**: "HTTP" → "Make an HTTP request"
2. **Configure**:
   - **URL**: `https://portal.thesmartpro.io/api/contracts/{{2.data.data.contract_id}}`
   - **Method**: PATCH
   - **Body**:
     ```json
     {
       "status": "completed",
       "document_id": "{{3.document_id}}",
       "document_url": "{{3.document_url}}",
       "pdf_url": "{{5.url}}",
       "updated_at": "{{now}}"
     }
     ```

#### **1.8 Save and Activate**
1. **Save** the scenario
2. **Activate** it
3. **Copy** the webhook URL

### **Step 2: Set Environment Variable**

Add this to your production environment:

```bash
MAKECOM_WEBHOOK_URL=https://hook.make.com/YOUR_WEBHOOK_ID
```

**For Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - **Name**: `MAKECOM_WEBHOOK_URL`
   - **Value**: `https://hook.make.com/YOUR_WEBHOOK_ID`
   - **Environment**: Production
5. Redeploy

**For Netlify:**
1. Go to Netlify Dashboard
2. Select your site
3. Go to Site settings → Environment variables
4. Add:
   - **Key**: `MAKECOM_WEBHOOK_URL`
   - **Value**: `https://hook.make.com/YOUR_WEBHOOK_ID`
5. Redeploy

### **Step 3: Test the Integration**

#### **3.1 Test Webhook Directly**
```bash
curl -X POST https://hook.make.com/YOUR_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "contract_type": "full-time-permanent",
    "promoter_id": "2df30edb-2bd3-4a31-869f-2394feed0f19",
    "first_party_id": "4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce",
    "second_party_id": "8776a032-5dad-4cd0-b0f8-c3cdd64e2831",
    "job_title": "promoter",
    "department": "Sales",
    "work_location": "seeb",
    "basic_salary": 250,
    "contract_start_date": "2025-10-18",
    "contract_end_date": "2026-10-17",
    "special_terms": ""
  }'
```

#### **3.2 Test Through Your Application**
1. Go to your contract generation form
2. Fill in the contract details
3. Submit the form
4. Check Make.com scenario execution
5. Verify PDF generation and upload

### **Step 4: Verify Integration**

#### **4.1 Check Environment Variable**
```bash
curl -X GET https://portal.thesmartpro.io/api/debug/contract-generation
```

Should show:
```json
{
  "environment": {
    "MAKECOM_WEBHOOK_URL": "✅ Set"
  }
}
```

#### **4.2 Test Make.com Endpoint**
```bash
curl -X GET https://portal.thesmartpro.io/api/contracts/makecom/generate?action=types
```

Should return available contract types.

## 🎯 **Expected Results**

After completing the setup:

### **✅ Working Flow:**
```
Frontend → API → Make.com → Google Docs → PDF → Supabase → Status Update
```

### **✅ Response Format:**
```json
{
  "success": true,
  "message": "Contract generated successfully via Make.com",
  "data": {
    "contract_id": "uuid-here",
    "contract_number": "PAC-18102025-XXXX",
    "makecom_response": {
      "status": 200,
      "success": true,
      "timestamp": "2025-10-18T18:30:00.000Z"
    },
    "document_id": "google-docs-id",
    "document_url": "https://docs.google.com/document/d/.../edit",
    "pdf_url": "https://supabase-storage-url/contract.pdf"
  }
}
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **404 Error**: Webhook URL is incorrect
   - **Fix**: Verify the webhook URL in Make.com

2. **Authentication Error**: API key missing
   - **Fix**: Add proper authentication headers

3. **Template Not Found**: Google Docs template ID wrong
   - **Fix**: Check template configuration

4. **Upload Failed**: Supabase connection issues
   - **Fix**: Verify Supabase credentials

### **Debug Steps:**

1. **Check Make.com logs** for errors
2. **Verify webhook URL** is correct
3. **Test template ID** in Google Docs
4. **Check Supabase connection**
5. **Review application logs**

## 🎉 **Benefits of Make.com Integration**

1. ✅ **Automated workflow** - No manual intervention needed
2. ✅ **Template processing** - Uses Google Docs templates
3. ✅ **PDF generation** - Automatic PDF creation
4. ✅ **File storage** - Uploads to Supabase
5. ✅ **Status updates** - Updates contract status automatically
6. ✅ **Error handling** - Comprehensive error management
7. ✅ **Scalability** - Handles multiple contracts simultaneously

## 📋 **Quick Checklist**

- [ ] Create Make.com scenario
- [ ] Add webhook trigger
- [ ] Configure HTTP requests
- [ ] Set up Google Docs integration
- [ ] Configure Supabase upload
- [ ] Add environment variable
- [ ] Deploy to production
- [ ] Test webhook
- [ ] Test contract generation
- [ ] Verify PDF creation
- [ ] Check file upload
- [ ] Confirm status updates

## 🚀 **Next Steps**

1. **Follow this guide** step by step
2. **Create the Make.com scenario** as described
3. **Set the environment variable** in production
4. **Test the complete workflow**
5. **Monitor logs** for any issues

After completing this setup, your Make.com integration will be fully functional! 🎉
