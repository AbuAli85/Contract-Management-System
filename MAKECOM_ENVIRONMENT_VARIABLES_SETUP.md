# Make.com Environment Variables Setup Guide

## 📝 Overview

This guide shows you how to add all required environment variables in Make.com for the contract generation workflow.

**Access**: Make.com Dashboard → Organization settings → Variables

---

## 🔑 Required Variables to Add

Add the following 7 variables to your Make.com organization:

### 1. SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Data type**: `text`
- **Value**: `https://reootcngcptfogfozlmz.supabase.co`
- **Purpose**: Base URL for Supabase REST API calls

### 2. SUPABASE_ANON_KEY
- **Name**: `SUPABASE_ANON_KEY`
- **Data type**: `text`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0`
- **Purpose**: Anonymous key for public Supabase REST API access

### 3. SUPABASE_SERVICE_KEY
- **Name**: `SUPABASE_SERVICE_KEY`
- **Data type**: `text`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE`
- **Purpose**: Service role key for privileged Supabase operations (bypasses RLS)

### 4. GOOGLE_DRIVE_FOLDER_ID
- **Name**: `GOOGLE_DRIVE_FOLDER_ID`
- **Data type**: `text`
- **Value**: `1WoJfPb62ILAKaMT1jEjXH3zwjfkXmg3a`
- **Purpose**: Google Drive folder where contracts will be stored

### 5. CONTRACTS_API_URL
- **Name**: `CONTRACTS_API_URL`
- **Data type**: `text`
- **Value**: `https://portal.thesmartpro.io`
- **Purpose**: Base URL of your contract management API (for webhook callbacks)

### 6. PDF_WEBHOOK_SECRET
- **Name**: `PDF_WEBHOOK_SECRET`
- **Data type**: `text`
- **Value**: `your-secret-key-here-replace-with-strong-value`
- **Purpose**: Secret key for verifying webhook signatures from Make.com

### 7. CONTRACTS_STORAGE_BUCKET
- **Name**: `CONTRACTS_STORAGE_BUCKET`
- **Data type**: `text`
- **Value**: `contracts`
- **Purpose**: Supabase storage bucket name for PDF files

---

## ✅ Step-by-Step Instructions

### Step 1: Navigate to Variables
1. Go to **Make.com Dashboard**
2. Click **Organization settings** (top right)
3. Select **Variables** tab
4. Click **"Add organization variable"** button

### Step 2: Add Each Variable
For each variable listed above:

1. **Fill in the Name field**
   - Paste the variable name exactly as shown
   - Only letters, digits, $ and _ symbols allowed
   - Cannot start with a digit

2. **Select Data Type**
   - Click dropdown
   - Select **"text"**

3. **Fill in the Value field**
   - Paste the value exactly as shown
   - ⚠️ **Important**: Do NOT store passwords here
   - Values are NOT encrypted

4. **Click "Save" button**

### Step 3: Verify Setup
After adding all 7 variables, you should see:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_KEY
- ✅ GOOGLE_DRIVE_FOLDER_ID
- ✅ CONTRACTS_API_URL
- ✅ PDF_WEBHOOK_SECRET
- ✅ CONTRACTS_STORAGE_BUCKET

---

## 🔐 Security Notes

⚠️ **Important**: 
- These values are stored **unencrypted** in Make.com
- Anyone with organization access can see them
- Use service role keys carefully - they bypass security policies
- Rotate keys periodically
- Consider using restrictive Supabase policies

---

## 🧪 Test the Variables

After setup, test by:

1. Open your webhook scenario
2. Click on Module 2 (HTTP - Fetch Contract)
3. Verify it shows: `{{env("SUPABASE_URL")}}/rest/v1/contracts`
4. If variables are set up correctly, Make.com will show values when hovering

---

## 🔧 Update Scenario Modules

After adding variables, update these modules in your scenario:

### Module 2: Fetch Contract Data
Replace hardcoded values with:
```
url: {{env("SUPABASE_URL")}}/rest/v1/contracts
apikey: {{env("SUPABASE_ANON_KEY")}}
Authorization: Bearer {{env("SUPABASE_SERVICE_KEY")}}
```

### Module 6: Create Google Docs
Replace hardcoded values with:
```
folderId: {{env("GOOGLE_DRIVE_FOLDER_ID")}}
```

### Module 20: Upload PDF to Storage
Replace hardcoded values with:
```
bucketID: {{env("CONTRACTS_STORAGE_BUCKET")}}
```

### Module 21: Send Webhook Callback
Replace hardcoded values with:
```
url: {{env("CONTRACTS_API_URL")}}/api/webhook/contract-pdf-ready
X-Webhook-Secret: {{env("PDF_WEBHOOK_SECRET")}}
```

### Module 22: Respond
Replace hardcoded values with:
```
pdf_url: {{env("SUPABASE_URL")}}/storage/v1/object/public/{{env("CONTRACTS_STORAGE_BUCKET")}}/{{20.file_name}}
```

---

## 🚨 Troubleshooting

### Variables not showing up?
- **Solution**: Refresh the page (F5)
- Refresh Make.com scenario editor
- Check if you clicked "Save" button

### "Variable not found" error?
- **Solution**: Variable name must match exactly (case-sensitive)
- Verify spelling: `SUPABASE_URL` not `supabase_url` or `Supabase_Url`

### Webhook callback failing?
- **Solution**: Verify `CONTRACTS_API_URL` is correct
- Check if your backend is accessible from Make.com IP range
- Verify webhook endpoint exists: `/api/webhook/contract-pdf-ready`

### "Unauthorized" errors?
- **Solution**: Verify Supabase keys are correct
- Check if keys have expired
- Verify Supabase RLS policies allow access

---

## 📋 Checklist

Before deploying:

- [ ] All 7 variables added to Make.com
- [ ] All values copied exactly (no extra spaces)
- [ ] Module 2 updated with env variables
- [ ] Module 6 updated with env variables
- [ ] Module 20 updated with env variables
- [ ] Module 21 updated with env variables
- [ ] Module 22 updated with env variables
- [ ] Scenario saved
- [ ] Test run completed successfully
- [ ] Contract PDF generated
- [ ] Webhook callback received

---

## 📞 Next Steps

1. ✅ Add all 7 organization variables to Make.com
2. ✅ Update all 5 modules with env variable references
3. ✅ Save your scenario
4. ✅ Run a test to generate a contract
5. ✅ Verify PDF is created and webhook callback is received

**Once complete, your Make.com integration will be secure and production-ready!** 🚀
