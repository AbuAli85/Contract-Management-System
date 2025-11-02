# ⚡ Quick Start: Email & PDF in 10 Minutes

Get email notifications and PDF generation working in just **10 minutes**!

---

## 🎯 Goal
Enable professional email notifications and PDF contract generation

## ⏱️ Time Required
**10-15 minutes** (5 min email + 5 min PDF + testing)

---

## 📧 STEP 1: Email Setup (5 minutes)

### 1.1 Get Resend API Key

1. Go to [resend.com/signup](https://resend.com/signup)
2. Sign up (free - no credit card)
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)

### 1.2 Add to Environment

**Local Development** (`.env.local`):
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@resend.dev
RESEND_FROM_NAME=SmartPro CMS
```

**Vercel Production:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `RESEND_API_KEY`
3. Click **Save**
4. **Redeploy** your app

### 1.3 Test Email

```bash
# Method 1: Browser
https://portal.thesmartpro.io/api/test-email

# Method 2: Terminal
curl https://portal.thesmartpro.io/api/test-email
```

✅ **Expected:** Email arrives in your inbox within 30 seconds

---

## 📄 STEP 2: PDF Setup (5 minutes)

### 2.1 Verify jsPDF is Installed

```bash
npm list jspdf
```

✅ **Expected:** `jspdf@3.0.1` (already in package.json)

### 2.2 Create Supabase Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Name: `contract-documents`
4. Set to **Public**
5. Click **Create**

### 2.3 Test PDF Generation

```bash
# Replace CONTRACT_ID and YOUR_TOKEN
curl -X POST https://portal.thesmartpro.io/api/pdf/generate-contract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"contractId": "CONTRACT_ID"}'
```

✅ **Expected:** Returns PDF URL

---

## 🧪 STEP 3: Test Everything (5 minutes)

### Test 1: Password Reset Email

```bash
curl -X POST https://portal.thesmartpro.io/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

✅ Check inbox for professional password reset email

### Test 2: Contract PDF

In your app:
1. Navigate to a contract
2. Click **Generate PDF**
3. Wait 3 seconds
4. Download the PDF

✅ PDF should be professional and complete

### Test 3: Document Expiry Alert

```bash
curl https://portal.thesmartpro.io/api/cron/check-document-expiry
```

✅ Promoters with expiring documents get emails

---

## 🎨 Customization (Optional)

### Change "From" Email

Once your domain is verified in Resend:

```env
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your Company Name
```

### Customize Email Templates

Edit files in `lib/email-templates/`:
- `password-reset.ts`
- `document-expiry.ts`
- `contract-status-change.ts`
- etc.

### Customize PDF Template

Edit `lib/pdf-templates/professional-contract.ts`:
- Change colors
- Add logo
- Modify layout
- Add sections

---

## 🚨 Troubleshooting

### Emails Not Arriving

**Check:**
1. ✅ `RESEND_API_KEY` is set in environment
2. ✅ Email is not in spam folder
3. ✅ Check Resend dashboard: [resend.com/emails](https://resend.com/emails)
4. ✅ Verify domain if using custom email

**Fix:**
```bash
# Test if API key works
curl https://portal.thesmartpro.io/api/test-email
```

### PDF Generation Fails

**Check:**
1. ✅ Contract has all required fields
2. ✅ Supabase storage bucket exists
3. ✅ Bucket is set to **public**
4. ✅ User has permission to generate PDF

**Fix:**
```bash
# Check server logs for error details
# Look for "Missing required fields" message
```

### "RESEND_API_KEY not configured"

**Fix:**
1. Add to `.env.local` for development
2. Add to Vercel environment variables for production
3. **Restart dev server** or **redeploy**

---

## ✅ Success Checklist

- [ ] Resend account created
- [ ] API key added to environment
- [ ] Test email sent successfully
- [ ] Email arrives in inbox
- [ ] jsPDF is installed
- [ ] Supabase bucket created
- [ ] Test PDF generated
- [ ] PDF downloads successfully
- [ ] Password reset email works
- [ ] Document alerts working

---

## 📊 What's Next?

### Production Deployment
1. Verify domain in Resend (for custom email)
2. Add DNS records (SPF, DKIM, DMARC)
3. Test all email types
4. Generate test PDFs
5. Monitor Resend dashboard

### Advanced Features
1. Customize email templates
2. Add company logo to PDFs
3. Create custom PDF layouts
4. Set up email analytics
5. Add SMS notifications (optional)

---

## 💡 Pro Tips

### Email
- Use `onboarding@` for welcome emails
- Use `alerts@` for document expiry
- Use `contracts@` for contract notifications
- Keep "From" name consistent

### PDF
- Generate PDFs in background for large batches
- Store PDFs for 90 days, then archive
- Email PDF links instead of attachments
- Use professional template for client-facing docs

### Monitoring
- Check Resend dashboard daily first week
- Monitor delivery rates (target: >95%)
- Track bounce rates (target: <2%)
- Watch server logs for PDF errors

---

## 🎉 You're Done!

**Email System:** ✅ Working  
**PDF Generation:** ✅ Working  
**Time Spent:** 10-15 minutes  
**System Completion:** 85% → 95%  

Now you have:
- ✅ Professional email notifications
- ✅ Beautiful PDF contracts
- ✅ Automated document alerts
- ✅ Password reset emails
- ✅ Production-ready system

**Total Cost:** $0-20/month (vs $100+ for alternatives)

---

## 📞 Need Help?

- **Setup Issues:** See `EMAIL_PDF_SETUP_GUIDE.md`
- **Testing:** See `TESTING_GUIDE_EMAIL_PDF.md`
- **Full Details:** See `IMPLEMENTATION_COMPLETE_EMAIL_PDF.md`
- **Resend Support:** [resend.com/support](https://resend.com/support)

---

**Next:** Test with real users and enjoy your professional contract management system! 🚀

