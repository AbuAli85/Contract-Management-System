# 🧪 Testing Guide: Email & PDF Features

Complete testing checklist for email notifications and PDF generation features.

**Date:** November 2, 2025  
**Features:** Email Notifications + PDF Generation  
**Status:** Ready for Testing

---

## 📧 PART 1: Email System Testing

### Test 1: Basic Email Configuration ✅

```bash
# Test 1A: Check if Resend API key is configured
curl https://portal.thesmartpro.io/api/test-email

# Expected Response:
# {
#   "success": true,
#   "message": "Test email sent successfully!",
#   "details": {
#     "messageId": "...",
#     "to": "your-email@example.com",
#     "from": "noreply@portal.thesmartpro.io"
#   }
# }

# Test 1B: Check email inbox
# ✅ Email should arrive within 30 seconds
# ✅ Check spam folder if not in inbox
# ✅ Verify sender is "SmartPro Contract Management System"
```

**Pass Criteria:**
- ✅ API returns success: true
- ✅ Message ID is returned
- ✅ Email arrives in inbox
- ✅ Email looks professional (HTML formatted)

---

### Test 2: Document Expiry Alerts 📋

```bash
# Test 2A: Manually trigger document monitoring
curl https://portal.thesmartpro.io/api/cron/check-document-expiry

# Expected Response:
# {
#   "success": true,
#   "alertsSent": 5,
#   "promotersNotified": 5,
#   "report": {
#     "critical": 2,
#     "warning": 3,
#     "notice": 0
#   }
# }

# Test 2B: Check promoter emails
# ✅ Promoters with expiring documents should receive emails
# ✅ Email should show document type, expiry date, days remaining
# ✅ Urgent emails should have red warning badges
```

**Pass Criteria:**
- ✅ Alerts sent matches number of expiring documents
- ✅ Email contains correct promoter name
- ✅ Expiry date is accurate
- ✅ "Upload New Document" button works

---

### Test 3: Welcome Email (New User Registration) 🎉

```bash
# Test 3A: Register a new user
curl -X POST https://portal.thesmartpro.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User",
    "role": "user"
  }'

# Test 3B: Check email
# ✅ Welcome email should arrive
# ✅ Contains user's name
# ✅ Has login link
# ✅ Professional formatting
```

**Pass Criteria:**
- ✅ Email arrives within 60 seconds
- ✅ Personalized with user's name
- ✅ Login link works
- ✅ No broken images or links

---

### Test 4: Password Reset Flow 🔑

```bash
# Test 4A: Request password reset
curl -X POST https://portal.thesmartpro.io/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Password reset email sent"
# }

# Test 4B: Check email
# ✅ Password reset email arrives
# ✅ Contains reset link
# ✅ Shows expiry time (1 hour)
# ✅ Has security warnings

# Test 4C: Click reset link
# ✅ Redirects to password reset page
# ✅ Token is valid
# ✅ Can set new password
```

**Pass Criteria:**
- ✅ Email arrives quickly
- ✅ Reset link works
- ✅ Link expires after 1 hour
- ✅ Can only be used once

---

### Test 5: Contract Status Change Notification 📄

```bash
# Test 5A: Update contract status
curl -X PATCH https://portal.thesmartpro.io/api/contracts/CONTRACT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "approved",
    "reason": "All requirements met"
  }'

# Test 5B: Check promoter email
# ✅ Status change email arrives
# ✅ Shows old status → new status
# ✅ Includes reason for change
# ✅ Has "View Contract" button

# Test 5C: Test rejection email
# Update status to "rejected"
# ✅ Email has different styling (red/warning)
# ✅ Shows action required message
```

**Pass Criteria:**
- ✅ Email sent to promoter
- ✅ Status badges have correct colors
- ✅ Reason is displayed
- ✅ Contract link works

---

### Test 6: Bulk Email Notifications 📬

```bash
# Test 6A: Send notification to multiple promoters
curl -X POST https://portal.thesmartpro.io/api/notifications/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipients": ["promoter1@example.com", "promoter2@example.com"],
    "subject": "Important Announcement",
    "message": "System maintenance scheduled for tomorrow",
    "priority": "high"
  }'

# Test 6B: Check delivery
# ✅ All emails sent (check Resend dashboard)
# ✅ Rate limiting respected (10 emails/sec)
# ✅ Failed sends are logged
```

**Pass Criteria:**
- ✅ All emails delivered
- ✅ No rate limit errors
- ✅ Delivery status tracked

---

## 📄 PART 2: PDF Generation Testing

### Test 7: Native PDF Generation (jsPDF) ✅

```bash
# Test 7A: Generate PDF for a contract
curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contractId": "CONTRACT_ID",
    "returnType": "url"
  }'

# Expected Response:
# {
#   "success": true,
#   "pdf_url": "https://supabase.co/storage/...",
#   "contract_number": "CTR-2025-001",
#   "generated_at": "2025-11-02T...",
#   "file_size": 45678,
#   "message": "PDF generated successfully using native jsPDF"
# }

# Test 7B: Download PDF
# Click the pdf_url
# ✅ PDF downloads correctly
# ✅ File is not corrupted
# ✅ All sections are present
```

**Pass Criteria:**
- ✅ PDF generates without errors
- ✅ File size is reasonable (< 5MB)
- ✅ PDF opens in viewer
- ✅ All contract data is visible

---

### Test 8: PDF Content Validation 📋

Open the generated PDF and verify:

**Header:**
- ✅ Professional title "EMPLOYMENT CONTRACT"
- ✅ Contract number is correct
- ✅ Date is current

**Parties Section:**
- ✅ Employer name, CRN, address
- ✅ Employee name, ID, contact info
- ✅ All data matches database

**Job Details:**
- ✅ Job title, department, location
- ✅ Working hours (if specified)

**Contract Terms:**
- ✅ Start date and end date
- ✅ Formatted correctly (DD Month YYYY)
- ✅ Probation period (if applicable)

**Compensation:**
- ✅ Basic salary with correct currency
- ✅ Allowances shown
- ✅ Total calculated correctly
- ✅ Numbers formatted with commas

**Special Terms:**
- ✅ Special terms appear
- ✅ Text wrapping works
- ✅ No text cutoff

**Signatures:**
- ✅ Signature boxes present
- ✅ Names in correct positions

**Footer:**
- ✅ Contract number
- ✅ Generation date
- ✅ Page numbers

---

### Test 9: PDF with Missing Data 🔍

```bash
# Test 9A: Try to generate PDF with incomplete contract
curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contractId": "INCOMPLETE_CONTRACT_ID"
  }'

# Expected Response (should fail gracefully):
# {
#   "error": "Missing required fields",
#   "details": "The following fields are required...",
#   "missingFields": ["promoter name", "start_date", ...]
# }
```

**Pass Criteria:**
- ✅ Returns error (not 500)
- ✅ Lists missing fields
- ✅ Helpful error message
- ✅ No PDF generated

---

### Test 10: PDF Download Feature ⬇️

```bash
# Test 10A: Generate PDF for direct download
curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contractId": "CONTRACT_ID",
    "returnType": "download"
  }' \
  --output contract.pdf

# Test 10B: Verify file
file contract.pdf
# Should show: PDF document, version 1.x

# Test 10C: Open PDF
# ✅ Opens without errors
# ✅ Content is correct
```

**Pass Criteria:**
- ✅ PDF downloads as attachment
- ✅ Filename is correct format
- ✅ File is valid PDF
- ✅ Can be opened in any PDF viewer

---

### Test 11: Professional PDF Template 🎨

```bash
# Test 11A: Generate using professional template
# (Will need to integrate this into API)
curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contractId": "CONTRACT_ID",
    "template": "professional",
    "returnType": "url"
  }'
```

**Visual Checks:**
- ✅ Header has blue gradient background
- ✅ Section headers are styled
- ✅ Salary box has background color
- ✅ Signature boxes have borders
- ✅ Footer on every page
- ✅ Professional appearance

---

## 🔄 PART 3: Integration Testing

### Test 12: Email + PDF Integration 📧📄

```bash
# Test 12A: Generate PDF and email it
curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contractId": "CONTRACT_ID",
    "sendEmail": true
  }'

# Test 12B: Check promoter email
# ✅ Email notification received
# ✅ Contains PDF download link
# ✅ Link works and downloads PDF
```

**Pass Criteria:**
- ✅ PDF generated
- ✅ Email sent
- ✅ PDF URL in email works
- ✅ Both operations succeed or fail together

---

### Test 13: Complete User Journey 🚀

**Scenario:** New promoter onboarding

1. **Register new user**
   - ✅ Welcome email arrives

2. **Admin approves user**
   - ✅ Approval email sent

3. **Create contract for promoter**
   - ✅ Contract created successfully

4. **Generate PDF**
   - ✅ PDF generated and stored

5. **Submit for approval**
   - ✅ Notification email to admin

6. **Admin approves contract**
   - ✅ Status change email to promoter
   - ✅ PDF download link included

7. **Document expiry monitoring**
   - ✅ Alerts sent as documents near expiry

**All emails should:**
- ✅ Have consistent branding
- ✅ Be professional
- ✅ Work on desktop and mobile
- ✅ Arrive within 60 seconds

---

## 📊 Performance Testing

### Test 14: Load Testing 💪

```bash
# Test 14A: Generate 10 PDFs concurrently
for i in {1..10}; do
  curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{\"contractId\": \"CONTRACT_ID_$i\"}" &
done
wait

# Test 14B: Send 50 emails
# (Already rate-limited to 10/sec)
```

**Pass Criteria:**
- ✅ All PDFs generate successfully
- ✅ No timeout errors
- ✅ Generation time < 3 seconds per PDF
- ✅ Email rate limiting works

---

### Test 15: Error Handling 🛡️

```bash
# Test 15A: Invalid contract ID
curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
  -H "Content-Type: application/json" \
  -d '{"contractId": "invalid-id"}'

# Expected: 404 error with helpful message

# Test 15B: Missing API key
curl https://portal.thesmartpro.io/api/test-email
# (After removing RESEND_API_KEY)

# Expected: Error message about configuration

# Test 15C: Invalid email address
curl -X POST https://portal.thesmartpro.io/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}'

# Expected: Validation error
```

**Pass Criteria:**
- ✅ All errors return proper HTTP codes
- ✅ Error messages are helpful
- ✅ No stack traces exposed
- ✅ Logs contain detailed info

---

## ✅ Final Checklist

### Email System
- [ ] Test endpoint returns success
- [ ] Document expiry alerts work
- [ ] Welcome emails sent on registration
- [ ] Password reset flow complete
- [ ] Contract status emails work
- [ ] Bulk emails function correctly
- [ ] All emails look professional
- [ ] Mobile-responsive emails
- [ ] Spam filters don't block emails

### PDF Generation
- [ ] Native jsPDF generates PDFs
- [ ] All contract data appears
- [ ] PDF formatting is correct
- [ ] Download feature works
- [ ] Professional template looks good
- [ ] Missing data handled gracefully
- [ ] File sizes are reasonable
- [ ] PDFs open in all viewers

### Integration
- [ ] Email + PDF works together
- [ ] Complete user journey succeeds
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] Rate limiting functions
- [ ] Logs are comprehensive

---

## 🎯 Success Criteria

To consider features **production-ready**:

1. **Email System:**
   - ✅ 95%+ delivery rate
   - ✅ < 60 second delivery time
   - ✅ 0% spam classification
   - ✅ All templates work

2. **PDF Generation:**
   - ✅ < 3 seconds generation time
   - ✅ 100% success rate for valid contracts
   - ✅ Proper error handling for invalid data
   - ✅ Professional appearance

3. **Integration:**
   - ✅ End-to-end flows work
   - ✅ No data inconsistencies
   - ✅ Graceful degradation
   - ✅ Comprehensive logging

---

## 📈 Monitoring

### Production Monitoring

**Email Metrics (Resend Dashboard):**
- Delivery rate
- Bounce rate
- Open rate
- Spam rate

**PDF Metrics (Server Logs):**
- Generation time
- Success/failure rate
- Storage usage
- Download count

**Alerts to Set Up:**
- Email delivery rate < 90%
- PDF generation time > 5 seconds
- Storage usage > 80%
- Error rate > 1%

---

**Testing Time:** 2-3 hours  
**Recommended:** Test in staging environment first  
**Status:** 🎉 **Ready for comprehensive testing!**

