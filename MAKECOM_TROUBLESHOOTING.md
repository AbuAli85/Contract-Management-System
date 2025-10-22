# Make.com Integration Troubleshooting

## 🚨 Current Issue

PDF generation script successfully triggers Make.com webhook, but contracts are not being updated with PDF URLs.

### Test Results:
- ✅ Script runs successfully
- ✅ Make.com webhook called (returned 200 OK)
- ❌ Contract NOT updated (status still "pending", no pdf_url)
- ❌ No callback received from Make.com

## 🔍 Possible Causes

### 1. Make.com Scenario Not Active/Configured
**Check:**
1. Login to Make.com: https://www.make.com/
2. Find your contract generation scenario
3. Verify status is **"Active"** (not "Draft" or "Paused")
4. Check execution history for errors

### 2. Make.com Scenario Not Calling Back
**The callback should be:**
```
POST https://your-app.vercel.app/api/webhook/contract-pdf-ready

Body:
{
  "contract_id": "uuid-here",
  "contract_number": "PAC-15102025-3302",
  "pdf_url": "https://storage.../contract.pdf",
  "google_drive_url": "https://docs.google.com/...",
  "status": "completed"
}
```

**Check in Make.com:**
- Does your scenario have an HTTP module to call the callback URL?
- Is the callback URL correct?
- Is the payload formatted correctly?

### 3. Google Docs Template Issues
**Check:**
- Does the Google Docs template exist?
- Is it shared with the service account?
- Are placeholders correct?

### 4. Make.com Execution Failing
**Check Make.com execution logs:**
- Look for errors in the scenario history
- Check which module is failing
- Verify all required fields are being received

## 🔧 Quick Diagnostic

### Test Make.com Manually:

1. Go to Make.com scenario
2. Click "Run once" with test data
3. Use this payload:

```json
{
  "contract_id": "test-id-123",
  "contract_number": "TEST-001",
  "first_party_id": "4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce",
  "second_party_id": "33ef31db-36c3-4fdd-b239-87b084ea1246",
  "promoter_id": "08558bc7-d026-43e4-b69d-1bd73a17b5da",
  "job_title": "Sales Promoter",
  "department": "Sales",
  "work_location": "Muscat",
  "basic_salary": 250,
  "currency": "OMR",
  "contract_start_date": "2025-10-22",
  "contract_end_date": "2026-10-22",
  "probation_period": "3 months",
  "notice_period": "30 days",
  "working_hours": "8 hours/day",
  "update_url": "https://your-app.vercel.app/api/webhook/contract-pdf-ready"
}
```

4. Check if PDF is generated
5. Check if callback is triggered

## 🎯 Alternative Solution

If Make.com integration is too complex, we have alternatives:

### Option A: Use Local PDF Generation
Modify the system to generate PDFs locally using a library like `puppeteer` or `pdfkit`.

### Option B: Manual PDF Upload
Add a feature to manually upload PDFs for contracts.

### Option C: Simpler Webhook
Create a simpler webhook that just generates from a template without all the complexity.

## 📋 Next Steps

1. **Check Make.com scenario status** - Is it active?
2. **Review Make.com execution logs** - Any errors?
3. **Test webhook manually** - Use Make.com's test feature
4. **Verify callback URL** - Is it accessible from Make.com?
5. **Check Google template** - Does it exist and work?

## 💡 Recommended Action

**Check your Make.com scenario NOW:**
1. Go to https://www.make.com/
2. Find the contract generation scenario
3. Look at recent executions
4. Share any error messages you see

This will help us diagnose why the callback isn't happening.

