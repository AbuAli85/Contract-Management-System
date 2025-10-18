# 🔧 Google Docs Template Troubleshooting Guide

## 🚨 **Current Issue**
Template sharing appears to be done but Google Drive storage quota error persists.

## 🛠️ **Alternative Solutions**

### **Solution 1: Create New Template**
1. **Create a new Google Doc** in your personal drive
2. **Add some basic content** (e.g., "Contract Template")
3. **Share it immediately** with: `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`
4. **Set permission to "Editor"**
5. **Update the template ID** in your environment variables

### **Solution 2: Check Service Account Permissions**
The service account might need additional permissions:
- **Google Drive API**: ✅ Enabled
- **Google Docs API**: ✅ Enabled
- **Service Account**: ✅ Configured

### **Solution 3: Verify Template ID**
Current template ID: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`

Make sure this is the correct ID from the URL:
`https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit`

### **Solution 4: Test with Different Template**
Try using a different template to see if the issue is template-specific.

## 🎯 **Quick Test**
1. Create a simple test document
2. Share it with the service account
3. Update the template ID
4. Test the contract generation

## 🚀 **Expected Result**
After proper template sharing, you should get:
- ✅ Contract created in database
- ✅ Google Doc generated
- ✅ PDF exported
- ✅ Files stored in Supabase

## 📋 **Checklist**
- [ ] Template is in personal drive
- [ ] Template is shared with service account
- [ ] Service account has "Editor" permission
- [ ] Template ID is correct
- [ ] Google APIs are enabled
- [ ] Service account key is valid
