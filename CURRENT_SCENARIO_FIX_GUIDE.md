# Current Scenario Fix Guide - Step by Step

## 🎯 Overview

This guide will help you fix the critical issues in your current Make.com scenario without needing to import a new one. We'll make targeted fixes to resolve the image processing, data consistency, and security issues.

## 🚨 Critical Issue #1: Image Processing (Module 6)

### Problem

The Google Docs template is using original URLs instead of uploaded Google Drive URLs.

### Fix Steps

1. **Open Make.com** and navigate to your scenario
2. **Click on Module 6** (Google Docs Template)
3. **Click "Edit"** on the module
4. **Find the "Image" section** in the mapping
5. **Replace the current image mapping** with:

```json
{
  "kix.d0m033g2v22b-t.0": "{{if(4.id; \"https://drive.google.com/uc?export=view&id=\" + 4.id; \"\")}}",
  "kix.hofhbp84rfny-t.0": "{{if(5.id; \"https://drive.google.com/uc?export=view&id=\" + 5.id; \"\")}}"
}
```

6. **Click "OK"** to save the changes

### What This Fixes

- Images will now appear correctly in generated PDFs
- Uses the actual uploaded Google Drive file IDs
- Handles cases where images fail to upload

## 🔐 Critical Issue #2: API Keys Security (Modules 2 & 21)

### Problem

API keys are hardcoded in the scenario configuration.

### Fix Steps

#### Step 2a: Create Environment Variables

1. **Go to Make.com Settings** → **Environment Variables**
2. **Click "Add Variable"**
3. **Add these variables**:

```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NzenFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTkxMDYsImV4cCI6MjA2NDg5NTEwNn0.6VGbocKFVLNX_MCIOwFtdEssMk6wd_UQ5yNT1CfV6BA

Name: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NzenFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMxOTEwNiwiZXhwIjoyMDY0ODk1MTA2fQ.dAf5W8m9Q8FGlLY19Lo2x8JYSfq3RuFMAsHaPcH3F7A
```

#### Step 2b: Update Module 2

1. **Click on Module 2** (HTTP GET)
2. **Click "Edit"**
3. **Find the "Headers" section**
4. **Update the apikey value** to: `{{$env.SUPABASE_ANON_KEY}}`
5. **Update the Authorization value** to: `Bearer {{$env.SUPABASE_SERVICE_KEY}}`
6. **Click "OK"** to save

#### Step 2c: Update Module 21

1. **Click on Module 21** (HTTP PATCH)
2. **Click "Edit"**
3. **Find the "Headers" section**
4. **Update the apikey value** to: `{{$env.SUPABASE_ANON_KEY}}`
5. **Update the Authorization value** to: `Bearer {{$env.SUPABASE_SERVICE_KEY}}`
6. **Click "OK"** to save

## 🔄 Critical Issue #3: Data References (Modules 20, 21, 22)

### Problem

Inconsistent data references using `{{14.value.contract_number}}` instead of `{{1.contract_number}}`.

### Fix Steps

#### Step 3a: Fix Module 20 (Supabase Upload)

1. **Click on Module 20** (Supabase Upload)
2. **Click "Edit"**
3. **Find the "File Name" field**
4. **Change from**: `{{14.value.contract_number}}-{{14.value.promoter_name_en}}.pdf`
5. **Change to**: `{{1.contract_number}}-{{1.promoter_name_en}}.pdf`
6. **Click "OK"** to save

#### Step 3b: Fix Module 21 (Database Update)

1. **Click on Module 21** (HTTP PATCH)
2. **Click "Edit"**
3. **Find the "URL" field**
4. **Change from**: `eq.{{14.value.contract_number}}`
5. **Change to**: `eq.{{1.contract_number}}`
6. **Click "OK"** to save

#### Step 3c: Fix Module 22 (Webhook Response)

1. **Click on Module 22** (Webhook Response)
2. **Click "Edit"**
3. **Find the "Body" field**
4. **Update the JSON** to use `{{1.contract_number}}` instead of `{{14.value.contract_number}}`
5. **Click "OK"** to save

## 🧪 Testing Your Fixes

### Test 1: Basic Functionality

```bash
curl -X POST https://hook.eu2.make.com/2640726 \
  -H "Content-Type: application/json" \
  -d '{
    "contract_number": "TEST-FIX-001",
    "promoter_name_en": "John Doe",
    "first_party_name_en": "Company A",
    "second_party_name_en": "Company B",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  }'
```

### Test 2: With Images

```bash
curl -X POST https://hook.eu2.make.com/2640726 \
  -H "Content-Type: application/json" \
  -d '{
    "contract_number": "TEST-IMG-001",
    "promoter_name_en": "Jane Smith",
    "first_party_name_en": "Company A",
    "second_party_name_en": "Company B",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "promoter_id_card_url": "https://example.com/id-card.jpg",
    "promoter_passport_url": "https://example.com/passport.jpg"
  }'
```

## ✅ Verification Checklist

After making the fixes, verify:

- [ ] **Module 6**: Image mapping uses `{{if(4.id; ...)}}` and `{{if(5.id; ...)}}`
- [ ] **Module 2**: Headers use `{{$env.SUPABASE_ANON_KEY}}` and `{{$env.SUPABASE_SERVICE_KEY}}`
- [ ] **Module 21**: Headers use environment variables
- [ ] **Module 20**: File name uses `{{1.contract_number}}-{{1.promoter_name_en}}.pdf`
- [ ] **Module 21**: URL uses `eq.{{1.contract_number}}`
- [ ] **Module 22**: Response uses `{{1.contract_number}}`
- [ ] **Environment Variables**: Both Supabase keys are set in Make.com settings

## 🔍 Troubleshooting

### If Images Still Don't Appear

1. **Check Module 4 and 5**: Ensure they're successfully uploading to Google Drive
2. **Verify Google Drive permissions**: Ensure the service account has access
3. **Check the image URLs**: Test the generated URLs manually

### If Database Updates Fail

1. **Verify environment variables**: Check they're set correctly
2. **Test API keys**: Try a manual API call with the keys
3. **Check contract exists**: Ensure the contract number exists in database

### If File Names Are Wrong

1. **Check data flow**: Verify `{{1.contract_number}}` has the expected value
2. **Test webhook input**: Ensure the webhook is receiving correct data
3. **Check module order**: Ensure data is flowing correctly through modules

## 📊 Expected Results

After applying these fixes:

1. **✅ Images will appear** in generated PDFs
2. **✅ File names will be consistent** across all operations
3. **✅ API keys will be secure** in environment variables
4. **✅ Data references will be consistent** throughout the flow
5. **✅ Error handling will be improved** (though still basic)

## 🚀 Next Steps

1. **Test thoroughly** with various scenarios
2. **Monitor execution logs** for any issues
3. **Consider implementing** the full improved scenario for better error handling
4. **Set up monitoring** and alerting
5. **Document any additional issues** found during testing

---

_This guide focuses on fixing the critical issues in your current scenario. Once these are working, consider implementing the full improved scenario for better error handling and reliability._
