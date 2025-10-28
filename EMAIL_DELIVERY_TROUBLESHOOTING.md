# 🚨 EMAIL DELIVERY TROUBLESHOOTING GUIDE

## ⚠️ ISSUE: Emails Not Being Received

### 📋 **STEP-BY-STEP CHECKLIST**

---

## ✅ **STEP 1: Check Spam/Junk Folder**
**Most common issue!**

1. Check your **Spam/Junk** folder in chairman@falconeyegroup.net
2. Check **Promotions** tab (if using Gmail)
3. Check **All Mail** folder
4. Search for: `from:noreply@portal.thesmartpro.io`
5. Search for: `SmartPro Contract`

---

## ✅ **STEP 2: Check Resend Dashboard**

### Go to: https://resend.com/emails

**What to check:**
```
✅ Email Status: "delivered" or "sent"
❌ Email Status: "failed", "bounced", "rejected"
```

**If you see any failed emails:**
- Click on the email to see error details
- Common errors:
  - `bounce` = Invalid email address
  - `spam` = Email marked as spam
  - `reject` = Domain not verified properly

---

## ✅ **STEP 3: Verify Domain DNS Records**

### Go to: https://resend.com/domains

**Check your domain: `portal.thesmartpro.io`**

Required records (should all be ✅ green):
```
✅ SPF Record
✅ DKIM Record  
✅ DMARC Record (optional but recommended)
```

**If any are ❌ red:**
1. Copy the DNS records from Resend
2. Add them to your domain DNS settings (GoDaddy/Namecheap/Cloudflare)
3. Wait 5-30 minutes for DNS propagation
4. Refresh Resend dashboard

---

## ✅ **STEP 4: Test Email Sending**

### Run the test script:

```bash
npm run test:email
```

**Expected output:**
```
✅ Email sent successfully: [message-id]
```

**If you see errors:**
- `RESEND_API_KEY not configured` → Check .env file
- `Domain not verified` → See Step 3
- `Invalid recipient` → Check email address

---

## ✅ **STEP 5: Check Server Logs**

### If deployed on Vercel:

1. Go to: https://vercel.com/your-project
2. Click on your deployment
3. Click "Functions" tab
4. Look for `/api/promoters/[id]/notify` logs
5. Check for errors like:
   ```
   ❌ Email send error: ...
   ❌ Failed to send email: ...
   ```

---

## ✅ **STEP 6: Verify Email Address**

**Is `chairman@falconeyegroup.net` correct?**

Check:
- ✅ No typos
- ✅ Domain is active
- ✅ Mailbox not full
- ✅ Not blocking external emails

**Test with a different email:**
- Try your personal Gmail/Outlook
- If that works, issue is with the recipient email

---

## ✅ **STEP 7: Check API Response**

**When you click "Send Notification" in the UI, open browser console (F12):**

Look for the API response:
```json
{
  "success": true,
  "notification": { ... },
  "emailResult": {
    "success": true,
    "messageId": "abc123"  ✅ This means email was sent!
  }
}
```

**If `emailResult.success: false`:**
- Check `emailResult.error` for details
- This means email failed to send

---

## 🔧 **COMMON FIXES**

### Fix 1: Domain Not Fully Verified
```bash
# Check Resend dashboard at: https://resend.com/domains
# Ensure all DNS records are ✅ green
```

### Fix 2: Email Going to Spam
**Add to DNS (DMARC record):**
```
Type: TXT
Name: _dmarc.portal.thesmartpro.io
Value: v=DMARC1; p=none; rua=mailto:chairman@falconeyegroup.net
```

**Whitelist the sender:**
- Add `noreply@portal.thesmartpro.io` to contacts
- Mark previous emails as "Not Spam"

### Fix 3: Rate Limiting
Resend has rate limits:
- **Sandbox**: 100 emails/day
- **Production**: Depends on your plan

Check: https://resend.com/settings/billing

---

## 🧪 **QUICK TEST**

Run this to test email delivery RIGHT NOW:

```bash
# Test with your own email first
node -e "
const { sendEmail } = require('./lib/services/email.service.ts');
sendEmail({
  to: 'YOUR-EMAIL@gmail.com',
  subject: '🧪 Test Email',
  html: '<h1>Test successful!</h1><p>If you see this, emails are working!</p>'
}).then(r => console.log('Result:', r));
"
```

---

## 📊 **DEBUGGING PRIORITY**

1. **🔴 HIGH**: Check spam folder (90% of issues)
2. **🟡 MEDIUM**: Check Resend dashboard for failures
3. **🟢 LOW**: Verify DNS records
4. **⚪ RARE**: Check server logs for errors

---

## 🆘 **STILL NOT WORKING?**

### Share these details:

1. ✅ Spam folder checked? (yes/no)
2. ✅ Resend dashboard status? (delivered/failed/bounced)
3. ✅ DNS records verified? (✅ all green / ❌ some red)
4. ✅ Test script result? (success/error message)
5. ✅ API response in browser console? (paste JSON)

---

## 📞 **RESEND SUPPORT**

If all else fails:
- Email: support@resend.com
- Docs: https://resend.com/docs
- Status: https://status.resend.com

---

**Most likely issue: Email is in spam folder! Check there first! 📧**

