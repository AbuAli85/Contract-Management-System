# 🔍 Make.com Scenario Diagnosis & Fix Guide

## 🎯 **Your Webhook URL**
```
https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
```

## 🔍 **Step 1: Check Your Make.com Scenario**

### **1.1 Go to Make.com Dashboard**
1. Visit [https://www.make.com/](https://www.make.com/)
2. Sign in to your account
3. Go to **"Scenarios"**
4. Find your contract generation scenario

### **1.2 Check Scenario Status**
- ✅ **Is the scenario ACTIVE?** (should be green/running)
- ✅ **Are there any error logs?** (check the execution history)
- ✅ **Is the webhook trigger configured correctly?**

## 🛠️ **Step 2: Common Make.com Scenario Issues**

### **Issue 1: Webhook Trigger Not Configured**
**Symptoms:** Webhook receives data but scenario doesn't execute

**Fix:**
1. **Check webhook trigger** in your scenario
2. **Verify the webhook URL** matches: `https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4`
3. **Ensure trigger is set to POST method**
4. **Check if trigger is active**

### **Issue 2: Google Docs Module Configuration**
**Symptoms:** Scenario runs but fails at Google Docs step

**Fix:**
1. **Check Google Docs connection** in Make.com
2. **Verify template ID**: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`
3. **Ensure template is shared** with your Make.com Google account
4. **Check Google Drive permissions**

### **Issue 3: Data Mapping Issues**
**Symptoms:** Scenario runs but creates empty or incorrect documents

**Fix:**
1. **Check data mapping** between webhook and Google Docs
2. **Verify field names** match your template placeholders
3. **Test with sample data**

### **Issue 4: Supabase Connection Issues**
**Symptoms:** Documents created but not uploaded to Supabase

**Fix:**
1. **Check Supabase connection** in Make.com
2. **Verify bucket name**: `contracts`
3. **Check file permissions**

## 🧪 **Step 3: Test Your Scenario Step by Step**

### **3.1 Test Webhook Trigger**
Send this test data to your webhook:
```json
{
  "test": "webhook trigger test",
  "timestamp": "2025-10-18T18:30:00Z"
}
```

**Expected:** Scenario should start executing

### **3.2 Test Google Docs Module**
Check if the Google Docs module can:
- ✅ **Access the template**
- ✅ **Create a new document**
- ✅ **Replace placeholders**

### **3.3 Test Supabase Upload**
Check if the Supabase module can:
- ✅ **Connect to your Supabase**
- ✅ **Upload files to the contracts bucket**
- ✅ **Return file URLs**

## 🎯 **Step 4: Recommended Make.com Scenario Flow**

### **Module 1: Webhook Trigger**
- **Type**: Custom webhook
- **Method**: POST
- **URL**: `https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4`

### **Module 2: Google Docs - Create Document**
- **Action**: Create a document from template
- **Template ID**: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`
- **Document Name**: `{{1.contract_number}}`
- **Variables**: Map all template placeholders

### **Module 3: Google Docs - Export PDF**
- **Action**: Export a document
- **Document ID**: `{{2.document_id}}`
- **Format**: PDF

### **Module 4: Supabase - Upload File**
- **Action**: Upload a file
- **Bucket**: `contracts`
- **File Data**: `{{3.data}}`
- **File Name**: `{{1.contract_number}}.pdf`

### **Module 5: HTTP Request - Update Contract**
- **Action**: Make an HTTP request
- **URL**: `https://portal.thesmartpro.io/api/contracts/{{1.contract_id}}`
- **Method**: PATCH
- **Body**: Update contract with document URLs

## 🚨 **Step 5: Debugging Steps**

### **5.1 Check Execution Logs**
1. Go to your scenario in Make.com
2. Click on **"Executions"** or **"History"**
3. Look for failed executions
4. Check error messages

### **5.2 Test Individual Modules**
1. **Run scenario manually** with test data
2. **Check each module** for errors
3. **Verify data flow** between modules

### **5.3 Check Connections**
1. **Google Docs connection** - test with a simple document
2. **Supabase connection** - test with a simple upload
3. **HTTP connections** - test with a simple request

## 🎯 **Step 6: Common Error Messages & Solutions**

### **"Template not found"**
- **Solution**: Verify template ID and sharing permissions

### **"Authentication failed"**
- **Solution**: Re-authenticate Google Docs and Supabase connections

### **"File upload failed"**
- **Solution**: Check Supabase bucket permissions and file size limits

### **"HTTP request failed"**
- **Solution**: Verify API endpoint URLs and authentication

## 🚀 **Step 7: Quick Fix Checklist**

- [ ] **Scenario is ACTIVE** (not paused)
- [ ] **Webhook trigger** is configured correctly
- [ ] **Google Docs connection** is working
- [ ] **Template is shared** with Make.com Google account
- [ ] **Supabase connection** is working
- [ ] **Data mapping** is correct
- [ ] **No error logs** in scenario execution

## 🎉 **Expected Result After Fix**

When working correctly, your Make.com scenario should:

1. ✅ **Receive webhook data**
2. ✅ **Create Google Docs document** from template
3. ✅ **Export document as PDF**
4. ✅ **Upload PDF to Supabase**
5. ✅ **Update contract status** via API
6. ✅ **Return success response**

## 📋 **Next Steps**

1. **Check your Make.com scenario** using this guide
2. **Fix any configuration issues** found
3. **Test the scenario** with sample data
4. **Verify end-to-end flow** works correctly

**The issue is likely in the Make.com scenario configuration, not in your application code!** 🎯
