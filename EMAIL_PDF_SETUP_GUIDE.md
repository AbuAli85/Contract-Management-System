# 📧 Email & PDF Setup Guide

Complete setup guide for enabling email notifications and PDF generation in your Contract Management System.

**Last Updated:** November 2, 2025  
**Estimated Setup Time:** 30-45 minutes

---

## 📧 PART 1: Email Notifications Setup

### Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Free tier includes: **100 emails/day, 3,000 emails/month**

### Step 2: Verify Your Domain

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain: `portal.thesmartpro.io` (or your domain)
4. Add the following DNS records to your domain:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM Record
Type: TXT
Name: resend._domainkey
Value: [Provided by Resend]

# DMARC Record (optional but recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

5. Wait for DNS propagation (5-30 minutes)
6. Click **Verify Domain** in Resend

### Step 3: Get Your API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: `Production - Contract Management System`
4. **Copy the key immediately** (you won't see it again!)

### Step 4: Add to Environment Variables

#### For Local Development (.env.local):

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@portal.thesmartpro.io
RESEND_FROM_NAME=SmartPro Contract Management System

# For testing
TEST_EMAIL=your-email@example.com
```

#### For Vercel Production:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   - `RESEND_API_KEY` → Your Resend API key
   - `RESEND_FROM_EMAIL` → `noreply@portal.thesmartpro.io`
   - `RESEND_FROM_NAME` → `SmartPro Contract Management System`
3. Click **Save**
4. **Redeploy** your application

### Step 5: Test Email System

```bash
# Method 1: Using the test endpoint
curl https://portal.thesmartpro.io/api/test-email

# Method 2: In browser
# Navigate to: https://portal.thesmartpro.io/api/test-email
# Should see success message with message ID

# Method 3: Check Resend Dashboard
# Go to Emails → Recent Emails
# Verify email was sent and delivered
```

### ✅ Email Templates Available

Your system now includes these professional email templates:

| Template | Purpose | Status |
|----------|---------|--------|
| **Password Reset** | Secure password recovery | ✅ Ready |
| **Welcome Email** | New user onboarding | ✅ Ready |
| **Document Expiry** | ID/Passport expiration alerts | ✅ Ready |
| **Contract Approval** | Contract status changes | ✅ Ready |
| **Contract Status Change** | Any status update | ✅ Ready |
| **Urgent Notification** | Critical alerts | ✅ Ready |
| **Standard Notification** | General notifications | ✅ Ready |

---

## 📄 PART 2: PDF Generation Setup

You have **two options** for PDF generation:

### Option A: Native jsPDF (Recommended) ✅

**Pros:**
- ✅ No external dependencies
- ✅ Works offline
- ✅ Free forever
- ✅ Full control over layout
- ✅ Better long-term maintainability

**Cons:**
- ⚠️ Requires more code
- ⚠️ Complex layouts need work

**Setup:**

```bash
# Dependencies already installed
npm list jspdf
# Should show: jspdf@3.0.1
```

**Usage:** PDF generation is already implemented! See:
- `lib/pdf-generator.ts` - PDF generation service
- `app/api/contracts/[id]/generate-pdf/route.ts` - API endpoint

**Test:**

```bash
# Test PDF generation
curl -X POST https://portal.thesmartpro.io/api/contracts/YOUR_CONTRACT_ID/generate-pdf
```

### Option B: Make.com Webhook (Alternative)

**Pros:**
- ✅ Easier for complex documents
- ✅ Visual workflow builder
- ✅ Can integrate with Google Docs templates

**Cons:**
- ❌ Requires external service
- ❌ Costs $9-29/month after free tier
- ❌ Internet connection required

**Setup:**

1. Create Make.com account: [https://make.com](https://make.com)
2. Import the scenario blueprint (see `MAKECOM_*.json` files)
3. Configure the webhook URL
4. Add to environment:

```env
# Make.com Integration
WEBHOOK_URL=https://hook.eu2.make.com/YOUR_WEBHOOK_ID
PDF_WEBHOOK_SECRET=your-secure-secret-here
```

---

## 🔄 PART 3: Integration Testing

### Test 1: Password Reset Email

```bash
# Trigger password reset
curl -X POST https://portal.thesmartpro.io/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'

# Check email inbox
# Should receive professional password reset email
```

### Test 2: Document Expiry Alert

```bash
# Run document monitoring
curl https://portal.thesmartpro.io/api/cron/check-document-expiry

# Check promoter emails
# Should receive expiry alerts for documents expiring soon
```

### Test 3: Contract Status Change

```bash
# Update a contract status
curl -X PATCH https://portal.thesmartpro.io/api/contracts/CONTRACT_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'

# Check email inbox
# Should receive contract status update email
```

### Test 4: PDF Generation

```bash
# Generate contract PDF
curl -X POST https://portal.thesmartpro.io/api/contracts/CONTRACT_ID/generate-pdf

# Response should include:
# {
#   "success": true,
#   "pdf_url": "https://..."
# }
```

---

## 📊 Monitoring & Troubleshooting

### Check Email Delivery Status

```bash
# Resend Dashboard
https://resend.com/emails

# Check specific email
# Copy message ID from API response
# Search in Resend dashboard
```

### Common Issues

#### 1. Emails Going to Spam

**Solution:**
- ✅ Verify domain in Resend
- ✅ Add SPF, DKIM, DMARC records
- ✅ Use professional "From" address
- ✅ Avoid spam trigger words
- ✅ Include unsubscribe link (for bulk emails)

#### 2. API Key Not Working

**Solution:**
```bash
# Check if key is valid
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@resend.dev","to":"delivered@resend.dev","subject":"Test","html":"<p>Test</p>"}'
```

#### 3. Rate Limit Exceeded

**Free Tier Limits:**
- 100 emails/day
- 3,000 emails/month
- 10 emails/second

**Solution:** Upgrade to paid plan ($20/month for 50,000 emails)

---

## 💰 Cost Breakdown

### Email Service (Resend)

| Plan | Monthly Cost | Emails/Month | Best For |
|------|--------------|--------------|----------|
| **Free** | $0 | 3,000 | Testing, small teams |
| **Pro** | $20 | 50,000 | Small to medium businesses |
| **Business** | $100 | 500,000 | Large businesses |

### PDF Generation

| Option | Monthly Cost | Best For |
|--------|--------------|----------|
| **jsPDF (Native)** | $0 | All businesses ✅ Recommended |
| **Make.com** | $9-29 | Complex workflows only |

**Recommended Total Cost:** $20/month (Resend Pro) + $0 (Native PDF) = **$20/month**

---

## ✅ Final Checklist

### Email Setup
- [ ] Resend account created
- [ ] Domain verified with DNS records
- [ ] API key generated and saved
- [ ] Environment variables configured in Vercel
- [ ] Test email sent and received
- [ ] Production emails working

### PDF Setup
- [ ] Decided on PDF method (jsPDF recommended)
- [ ] Test PDF generated successfully
- [ ] PDF storage configured (Supabase)
- [ ] PDF download working

### Integration
- [ ] Password reset emails working
- [ ] Document expiry alerts working
- [ ] Contract status emails working
- [ ] Welcome emails for new users working
- [ ] All email templates tested

---

## 🚀 You're Ready for Production!

Once all checklist items are complete:

1. ✅ Email system: 100% functional
2. ✅ PDF generation: 100% functional
3. ✅ System completeness: **95%+**
4. ✅ Ready for real users!

---

## 📞 Support Resources

- **Resend Docs:** https://resend.com/docs
- **jsPDF Docs:** https://github.com/parallax/jsPDF
- **Make.com Docs:** https://make.com/en/help

---

**Setup Time:** 30-45 minutes  
**Monthly Cost:** $20-50  
**Impact:** Critical - Enables all notifications and documentation

**Status:** 🎉 **Both features are now production-ready!**

