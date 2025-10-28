# 📧 Resend.io Email Integration - Complete Setup Guide

**Status:** Ready to implement  
**Time:** 30 minutes  
**Difficulty:** Easy  
**Cost:** FREE (up to 3,000 emails/month) or $20/mo (50k emails)

---

## ✨ **Why Resend.io?**

- ✅ **Modern Developer Experience** - Best-in-class DX
- ✅ **React Email Support** - Beautiful email templates
- ✅ **Generous Free Tier** - 3,000 emails/month free
- ✅ **Great Deliverability** - High inbox placement rate
- ✅ **Simple API** - Easy to integrate
- ✅ **TypeScript First** - Perfect for your project

---

## 🚀 **STEP-BY-STEP SETUP**

### **Step 1: Create Resend Account** (5 minutes)

1. Go to https://resend.com
2. Sign up (free account)
3. Verify your email
4. Get your API key from https://resend.com/api-keys

---

### **Step 2: Install Package** (1 minute)

```bash
npm install resend
```

---

### **Step 3: Add Environment Variable** (1 minute)

Add to your `.env.local`:

```env
# Resend Email Service
RESEND_API_KEY=re_123456789abcdefghijk
RESEND_FROM_EMAIL=onboarding@resend.dev  # Use this for testing
# After domain verification, use: RESEND_FROM_EMAIL=noreply@yourdomain.com
```

Also add to `env.example` (for documentation):

```env
# ========================================
# 📧 RESEND EMAIL SERVICE
# ========================================

# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_your_api_key_here

# From Email Address
# Testing: onboarding@resend.dev (works immediately)
# Production: noreply@yourdomain.com (requires domain verification)
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Contract Management System
```

---

### **Step 4: Create Email Service** (10 minutes)

Create new file: `lib/services/email.service.ts`

```typescript
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'Contract Management System'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Email sent successfully:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('❌ Email send exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send bulk emails (with rate limiting consideration)
 */
export async function sendBulkEmails(
  emails: EmailOptions[]
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const email of emails) {
    const result = await sendEmail(email);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(result.error || 'Unknown error');
    }

    // Small delay to avoid rate limits (Resend: 10 emails/second on free tier)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  results.success = results.failed === 0;
  return results;
}
```

---

### **Step 5: Create Email Templates** (10 minutes)

Create directory: `lib/email-templates/`

#### **Template 1: Document Expiry**

`lib/email-templates/document-expiry.ts`:

```typescript
export function documentExpiryEmail(data: {
  promoterName: string;
  documentType: 'ID Card' | 'Passport';
  expiryDate: string;
  daysRemaining: number;
  urgent: boolean;
}) {
  const urgentBadge = data.urgent
    ? '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">URGENT</span>'
    : '';

  return {
    subject: `${data.urgent ? '🚨 URGENT: ' : '⚠️ '}${data.documentType} Expiring ${data.urgent ? 'Soon' : `in ${data.daysRemaining} days`}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                      Document Expiry Notice
                    </h1>
                    ${urgentBadge ? `<div style="margin-top: 10px;">${urgentBadge}</div>` : ''}
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.promoterName}</strong>,
                    </p>
                    
                    <div style="background: ${data.urgent ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${data.urgent ? '#dc2626' : '#f59e0b'}; padding: 20px; border-radius: 4px; margin: 20px 0;">
                      <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: ${data.urgent ? '#991b1b' : '#92400e'};">
                        ${data.urgent ? '⚠️' : '📋'} Your ${data.documentType} ${data.urgent ? 'is expiring very soon!' : 'will expire soon'}
                      </p>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Document Type:</td>
                          <td style="text-align: right; font-weight: 600;">${data.documentType}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Expiry Date:</td>
                          <td style="text-align: right; font-weight: 600; color: ${data.urgent ? '#dc2626' : '#f59e0b'};">${data.expiryDate}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Days Remaining:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 20px; color: ${data.urgent ? '#dc2626' : '#f59e0b'};">${data.daysRemaining}</td>
                        </tr>
                      </table>
                    </div>

                    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
                      <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1f2937;">
                        📝 Action Required
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                        <li>Please renew your ${data.documentType} as soon as possible</li>
                        <li>Upload the new document to the system</li>
                        <li>Contact HR if you need assistance</li>
                      </ul>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/profile" 
                         style="display: inline-block; background: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Upload New Document
                      </a>
                    </div>

                    ${data.urgent ? `
                      <div style="background: #fee2e2; border: 2px solid #fca5a5; padding: 15px; border-radius: 6px; margin-top: 20px;">
                        <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">
                          ⚠️ <strong>Important:</strong> Expired documents may affect your employment status and contract validity.
                        </p>
                      </div>
                    ` : ''}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                      This is an automated notification from Contract Management System
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      If you have questions, please contact your HR department
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Dear ${data.promoterName},

${data.urgent ? 'URGENT:' : ''} Your ${data.documentType} is expiring ${data.urgent ? 'very soon' : `in ${data.daysRemaining} days`}.

Expiry Date: ${data.expiryDate}
Days Remaining: ${data.daysRemaining}

ACTION REQUIRED:
- Please renew your ${data.documentType} as soon as possible
- Upload the new document to the system
- Contact HR if you need assistance

Upload at: ${process.env.NEXT_PUBLIC_APP_URL}/en/profile

${data.urgent ? 'WARNING: Expired documents may affect your employment status and contract validity.' : ''}

This is an automated notification from Contract Management System.
    `,
  };
}
```

#### **Template 2: Contract Approval**

`lib/email-templates/contract-approval.ts`:

```typescript
export function contractApprovalEmail(data: {
  recipientName: string;
  contractId: string;
  contractType: string;
  partyName: string;
  amount?: string;
  startDate?: string;
  actionUrl: string;
}) {
  return {
    subject: `📋 Contract Approval Required - ${data.contractType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                      Contract Approval Required
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.recipientName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0;">
                      A new contract requires your approval.
                    </p>

                    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                      <h3 style="margin: 0 0 15px 0; color: #1e40af;">Contract Details</h3>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280;">Contract ID:</td>
                          <td style="text-align: right; font-weight: 600;">${data.contractId}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280;">Type:</td>
                          <td style="text-align: right; font-weight: 600;">${data.contractType}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280;">Party:</td>
                          <td style="text-align: right; font-weight: 600;">${data.partyName}</td>
                        </tr>
                        ${data.amount ? `
                          <tr>
                            <td style="color: #6b7280;">Amount:</td>
                            <td style="text-align: right; font-weight: 600; color: #059669;">${data.amount}</td>
                          </tr>
                        ` : ''}
                        ${data.startDate ? `
                          <tr>
                            <td style="color: #6b7280;">Start Date:</td>
                            <td style="text-align: right; font-weight: 600;">${data.startDate}</td>
                          </tr>
                        ` : ''}
                      </table>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${data.actionUrl}" 
                         style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Review & Approve Contract
                      </a>
                    </div>

                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                      Or copy this link: <br>
                      <a href="${data.actionUrl}" style="color: #3b82f6;">${data.actionUrl}</a>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">
                      Contract Management System | Automated Notification
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Dear ${data.recipientName},

A new contract requires your approval.

CONTRACT DETAILS:
- Contract ID: ${data.contractId}
- Type: ${data.contractType}
- Party: ${data.partyName}
${data.amount ? `- Amount: ${data.amount}` : ''}
${data.startDate ? `- Start Date: ${data.startDate}` : ''}

Review at: ${data.actionUrl}

Contract Management System
    `,
  };
}
```

#### **Template 3: Welcome Email**

`lib/email-templates/welcome.ts`:

```typescript
export function welcomeEmail(data: {
  userName: string;
  email: string;
  role: string;
  loginUrl: string;
}) {
  return {
    subject: '🎉 Welcome to Contract Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #374151;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px;">
          <h1 style="color: #1f2937; margin-bottom: 20px;">Welcome to Contract Management System! 🎉</h1>
          
          <p>Dear <strong>${data.userName}</strong>,</p>
          
          <p>Your account has been approved and is now active!</p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Account Details</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${data.role}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" 
               style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Login to Your Account
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please contact your system administrator.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Contract Management System!

Dear ${data.userName},

Your account has been approved and is now active!

Account Details:
- Email: ${data.email}
- Role: ${data.role}

Login at: ${data.loginUrl}

If you have any questions, please contact your system administrator.
    `,
  };
}
```

---

### **Step 6: Update Notification Service** (5 minutes)

Update `lib/services/promoter-notification.service.ts`:

Replace lines 108-129 with:

```typescript
import { sendEmail as sendResendEmail } from '@/lib/services/email.service';
import { documentExpiryEmail } from '@/lib/email-templates/document-expiry';

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  return await sendResendEmail({
    to,
    subject,
    html: body,
    text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  });
}
```

---

### **Step 7: Test the Integration** (5 minutes)

Create a test file: `scripts/test-email.ts`

```typescript
import { sendEmail } from '@/lib/services/email.service';
import { documentExpiryEmail } from '@/lib/email-templates/document-expiry';

async function testEmail() {
  console.log('🧪 Testing Resend email integration...\n');

  // Test 1: Simple email
  console.log('Test 1: Sending simple email...');
  const result1 = await sendEmail({
    to: 'your-email@example.com', // Change this to your email
    subject: 'Test Email from Contract Management System',
    html: '<h1>Hello!</h1><p>This is a test email.</p>',
    text: 'Hello! This is a test email.',
  });

  if (result1.success) {
    console.log('✅ Simple email sent! Message ID:', result1.messageId);
  } else {
    console.log('❌ Failed to send:', result1.error);
  }

  // Test 2: Document expiry template
  console.log('\nTest 2: Sending document expiry email...');
  const emailContent = documentExpiryEmail({
    promoterName: 'John Doe',
    documentType: 'Passport',
    expiryDate: '2025-12-31',
    daysRemaining: 15,
    urgent: true,
  });

  const result2 = await sendEmail({
    to: 'your-email@example.com', // Change this to your email
    ...emailContent,
  });

  if (result2.success) {
    console.log('✅ Template email sent! Message ID:', result2.messageId);
  } else {
    console.log('❌ Failed to send:', result2.error);
  }

  console.log('\n✨ Test complete! Check your inbox.');
}

testEmail();
```

Run the test:

```bash
# Add to package.json scripts:
"test:email": "tsx scripts/test-email.ts"

# Run:
npm run test:email
```

---

## 🎯 **INTEGRATION CHECKLIST**

After setup, integrate with your existing features:

### ✅ **Document Expiry Notifications**

Update `lib/document-monitor.ts` (line 250-288):

```typescript
import { sendEmail } from '@/lib/services/email.service';
import { documentExpiryEmail } from '@/lib/email-templates/document-expiry';

private async sendAlert(alert: DocumentAlert): Promise<void> {
  const docName = alert.documentType === 'id_card' ? 'ID Card' : 'Passport';
  
  const emailContent = documentExpiryEmail({
    promoterName: alert.promoterName,
    documentType: docName as 'ID Card' | 'Passport',
    expiryDate: alert.expiryDate,
    daysRemaining: alert.daysUntilExpiry,
    urgent: alert.severity === 'critical',
  });

  await sendEmail({
    to: alert.promoterEmail,
    ...emailContent,
  });
}
```

### ✅ **Contract Approvals**

Create new endpoint: `app/api/contracts/send-approval-request/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/email.service';
import { contractApprovalEmail } from '@/lib/email-templates/contract-approval';

export async function POST(req: NextRequest) {
  const { contractId, approverEmail, approverName, contractData } = await req.json();

  const emailContent = contractApprovalEmail({
    recipientName: approverName,
    contractId: contractId,
    contractType: contractData.type,
    partyName: contractData.partyName,
    amount: contractData.amount,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/en/contracts/${contractId}`,
  });

  const result = await sendEmail({
    to: approverEmail,
    ...emailContent,
  });

  return NextResponse.json(result);
}
```

### ✅ **Password Reset**

Update `app/api/auth/change-password/route.ts` (line 256-270):

```typescript
import { sendEmail } from '@/lib/services/email.service';

await sendEmail({
  to: user.email,
  subject: '🔐 Password Changed - Security Alert',
  html: emailBody, // Use existing email body from the file
  text: `Your password was changed on ${timestamp}. If this wasn't you, please contact support immediately.`,
});
```

---

## 🚀 **PRODUCTION SETUP**

### **Domain Verification** (for professional emails)

1. Go to Resend Dashboard: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records to your domain provider:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually 5-10 minutes)
6. Update `.env.local`:
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

### **Vercel Environment Variables**

```bash
vercel env add RESEND_API_KEY production
# Paste your API key when prompted

vercel env add RESEND_FROM_EMAIL production
# Enter: noreply@yourdomain.com

vercel env add RESEND_FROM_NAME production
# Enter: Contract Management System
```

---

## 📊 **MONITORING**

### **Check Email Delivery**

Resend Dashboard: https://resend.com/emails

- See all sent emails
- Delivery status
- Opens and clicks (if enabled)
- Bounce/complaint tracking

### **Rate Limits**

**Free Plan:**
- 3,000 emails/month
- 10 emails/second
- 100 emails/day limit

**Paid Plan ($20/month):**
- 50,000 emails/month
- No daily limit
- Same 10 emails/second
- Phone support

---

## ✅ **SUCCESS CRITERIA**

After completing this setup:

- ✅ Emails send successfully
- ✅ Beautiful HTML emails with templates
- ✅ Document expiry notifications work
- ✅ Contract approval emails work
- ✅ Password reset emails work
- ✅ Monitoring in Resend dashboard

---

## 🆚 **RESEND vs SENDGRID**

| Feature | Resend | SendGrid |
|---------|--------|----------|
| **Free Tier** | 3,000/month | 100/day |
| **Developer Experience** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Setup Complexity** | Easy | Medium |
| **TypeScript Support** | Native | Via package |
| **React Email** | Built-in | Manual |
| **Pricing** | $20/50k | $15/50k |
| **Deliverability** | Excellent | Excellent |

**Recommendation:** ✅ **Resend** for modern Next.js apps

---

## 🐛 **TROUBLESHOOTING**

### **"API key not found"**
- Check `.env.local` has `RESEND_API_KEY`
- Restart dev server after adding

### **"Email not sending"**
- Check API key is valid
- Check free tier limit (3,000/month)
- Look at Resend dashboard for errors

### **"From address not allowed"**
- Use `onboarding@resend.dev` for testing
- Verify your domain for custom emails

---

## 📚 **ADDITIONAL RESOURCES**

- **Resend Docs:** https://resend.com/docs
- **React Email:** https://react.email
- **Email Best Practices:** https://resend.com/docs/send-with-nextjs

---

**Ready to implement?** Start with Step 1! 🚀

**Estimated Time:** 30 minutes from start to first email sent

