# Make.com Webhook Configuration - Complete Guide

## 🎯 **Current Status**

### ✅ **What's Working:**
- Webhook endpoint is accessible
- Authentication is working
- Payload structure is correct
- Field validation is implemented

### ⚠️ **Current Issue:**
- Webhook returns 500 error: "Failed to fetch contract"
- This is likely due to the webhook changes not being deployed yet

## 🔧 **Make.com HTTP Module Configuration**

### **Basic Settings:**
```
URL: https://portal.thesmartpro.io/api/webhook/makecom-simple
Method: POST
Content-Type: application/json
Timeout: 300
```

### **Headers Configuration:**
```
1. Content-Type: application/json
2. X-Webhook-Secret: make_webhook_0b37f95424ac249e6bbdad4e39de6028d09f8ec8b84bd671b36c8905ec93f806
3. X-Request-ID: {{execution.id}}
```

### **Request Body (JSON):**
```json
{
  "contract_id": "{{53.contract_id}}",
  "contract_number": "{{54.contract_number}}",
  "contract_type": "{{55.stored_contract_type}}",
  "promoter_id": "{{55.stored_promoter_id}}",
  "first_party_id": "{{55.stored_first_party_id}}",
  "second_party_id": "{{55.stored_second_party_id}}",
  "job_title": "{{55.stored_job_title}}",
  "department": "{{55.stored_department}}",
  "work_location": "{{55.stored_work_location}}",
  "basic_salary": "{{55.stored_basic_salary}}",
  "contract_start_date": "{{55.stored_contract_start_date}}",
  "contract_end_date": "{{55.stored_contract_end_date}}",
  "special_terms": "{{55.stored_special_terms}}",
  "header_logo": "{{55.stored_extra_logo_url}}"
}
```

### **Error Handling:**
```
Evaluate all states as errors (except for 2xx and 3xx): true
```

## 🚀 **Deployment Steps**

### **1. Deploy the Webhook Changes**
The webhook code has been updated but needs to be deployed. You need to:

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Fix webhook 500 error - improve error handling"
   git push
   ```

2. **Deploy to your hosting platform** (Vercel, Netlify, etc.)

3. **Wait for deployment to complete** (usually 1-2 minutes)

### **2. Test After Deployment**
Once deployed, the webhook should work correctly with both:
- Complete payloads (with all fields filled)
- Incomplete payloads (with empty fields)

## 🧪 **Testing the Configuration**

### **Test 1: Complete Payload**
```json
{
  "contract_id": "test-123",
  "contract_number": "TEST-2025-001",
  "contract_type": "full-time-permanent",
  "promoter_id": "5106a3f8-a3db-44cc-b9c3-8e3c8768ff66",
  "first_party_id": "4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce",
  "second_party_id": "a7453123-f814-47a5-b3fa-e119eb5f2da6",
  "job_title": "Sales Representative",
  "department": "Sales",
  "work_location": "Dubai",
  "basic_salary": "250",
  "contract_start_date": "2025-10-19",
  "contract_end_date": "2026-10-18",
  "special_terms": "Standard terms",
  "header_logo": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/party-logos/extra%20logo1.png"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "contract_id": "generated-uuid",
  "contract_number": "TEST-2025-001",
  "status": "created",
  "template_id": "1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0"
}
```

### **Test 2: Empty Fields Payload**
```json
{
  "contract_id": "test-124",
  "contract_number": "TEST-2025-002",
  "contract_type": "full-time-permanent",
  "promoter_id": "5106a3f8-a3db-44cc-b9c3-8e3c8768ff66",
  "first_party_id": "4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce",
  "second_party_id": "a7453123-f814-47a5-b3fa-e119eb5f2da6",
  "job_title": "",
  "department": "",
  "work_location": "",
  "basic_salary": "250",
  "contract_start_date": "2025-10-19",
  "contract_end_date": "2026-10-18",
  "special_terms": "",
  "header_logo": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/party-logos/extra%20logo1.png"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "contract_id": "generated-uuid",
  "contract_number": "TEST-2025-002",
  "status": "created",
  "template_id": "1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0"
}
```

## 🔍 **Troubleshooting**

### **If Still Getting 500 Errors:**

1. **Check Deployment Status:**
   - Verify the webhook changes are deployed
   - Check server logs for detailed error messages

2. **Verify Database Connection:**
   - Ensure Supabase connection is working
   - Check if the contracts table exists

3. **Check Required Fields:**
   - Ensure `promoter_id` is valid
   - Ensure `contract_type` is one of: `employment`, `service`, `consultancy`, `partnership`

4. **Test with Minimal Payload:**
   ```json
   {
     "contract_type": "full-time-permanent",
     "promoter_id": "5106a3f8-a3db-44cc-b9c3-8e3c8768ff66"
   }
   ```

## 📋 **Next Steps**

1. **Deploy the webhook changes** to your hosting platform
2. **Test the webhook** with the provided test payloads
3. **Configure Make.com** with the exact settings above
4. **Run a test scenario** in Make.com to verify everything works

## 🎉 **Expected Results After Deployment**

- ✅ **200 Status Code** for successful requests
- ✅ **Contract Creation** in the database
- ✅ **Proper Error Handling** for invalid requests
- ✅ **Support for Empty Fields** without errors
- ✅ **Detailed Response** with contract information

The webhook should work perfectly once the changes are deployed! 🚀
