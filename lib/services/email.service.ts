import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Email recipient (to) is required');
    }

    if (!options.subject) {
      throw new Error('Email subject is required');
    }

    if (!options.html && !options.text) {
      throw new Error('Email must have either HTML or text content');
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return {
        success: false,
        error: 'Email service is not configured',
      };
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'noreply@portal.thesmartpro.io';
    const fromName =
      process.env.RESEND_FROM_NAME || 'SmartPro Contract Management System';

    const { data, error } = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text:
        options.text || (options.html ? stripHtml(options.html) : undefined),
      ...(options.replyTo && { replyTo: options.replyTo }),
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
      ...(options.attachments && {
        attachments: options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          ...(att.contentType && { content_type: att.contentType }),
        })),
      }),
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
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
export async function sendBulkEmails(emails: EmailOptions[]): Promise<{
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

/**
 * Get email status and details by message ID
 */
export async function getEmailStatus(messageId: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
  details?: any;
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const { data, error } = await getResendClient().emails.get(messageId);

    if (error) {
      console.error('❌ Failed to get email status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get email status',
      };
    }

    console.log('✅ Email status retrieved:', data);
    return {
      success: true,
      status: data?.last_event || 'unknown',
      details: data,
    };
  } catch (error) {
    console.error('❌ Get email status exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simple HTML stripper for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin-top: 0;">Password Reset Request</h1>
          <p>Hello,</p>
          <p>We received a request to reset your password for your SmartPro Contract Management System account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${resetUrl}
          </p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
        <div style="color: #6c757d; font-size: 12px; text-align: center;">
          <p>This is an automated email from SmartPro Contract Management System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Password Reset Request

Hello,

We received a request to reset your password for your SmartPro Contract Management System account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

---
This is an automated email from SmartPro Contract Management System.
Please do not reply to this email.
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - SmartPro Contract Management',
    html,
    text,
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  loginUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SmartPro</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin-top: 0;">Welcome to SmartPro! 🎉</h1>
          <p>Hello ${name},</p>
          <p>Your account has been approved and is now active! You can now access the SmartPro Contract Management System.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Login to Your Account</a>
          </div>
          <p>Here's what you can do with your account:</p>
          <ul>
            <li>Create and manage contracts</li>
            <li>Track contract approvals</li>
            <li>Generate PDF documents</li>
            <li>Manage promoters and parties</li>
            <li>Access analytics and reports</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>
        <div style="color: #6c757d; font-size: 12px; text-align: center;">
          <p>This is an automated email from SmartPro Contract Management System.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to SmartPro!

Hello ${name},

Your account has been approved and is now active! You can now access the SmartPro Contract Management System.

Login to your account: ${loginUrl}

Here's what you can do with your account:
- Create and manage contracts
- Track contract approvals
- Generate PDF documents
- Manage promoters and parties
- Access analytics and reports

If you have any questions or need assistance, please don't hesitate to contact our support team.

---
This is an automated email from SmartPro Contract Management System.
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to SmartPro Contract Management System',
    html,
    text,
  });
}

/**
 * Send contract approval notification
 */
export async function sendContractApprovalEmail(
  email: string,
  contractNumber: string,
  contractUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contract Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #10b981; margin-top: 0;">Contract Approved ✅</h1>
          <p>Good news! Contract <strong>${contractNumber}</strong> has been approved.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractUrl}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Contract</a>
          </div>
          <p>You can now download the final PDF document and proceed with execution.</p>
        </div>
        <div style="color: #6c757d; font-size: 12px; text-align: center;">
          <p>This is an automated email from SmartPro Contract Management System.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Contract Approved

Good news! Contract ${contractNumber} has been approved.

View contract: ${contractUrl}

You can now download the final PDF document and proceed with execution.

---
This is an automated email from SmartPro Contract Management System.
  `;

  return sendEmail({
    to: email,
    subject: `Contract ${contractNumber} Approved`,
    html,
    text,
  });
}

/**
 * Send contract PDF via email
 */
export async function sendContractPDFEmail(
  email: string,
  contractNumber: string,
  pdfBuffer: Buffer
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contract PDF</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin-top: 0;">Contract PDF Ready 📄</h1>
          <p>Your contract <strong>${contractNumber}</strong> PDF is attached to this email.</p>
          <p>Please review the document and keep it for your records.</p>
        </div>
        <div style="color: #6c757d; font-size: 12px; text-align: center;">
          <p>This is an automated email from SmartPro Contract Management System.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Contract PDF Ready

Your contract ${contractNumber} PDF is attached to this email.

Please review the document and keep it for your records.

---
This is an automated email from SmartPro Contract Management System.
  `;

  return sendEmail({
    to: email,
    subject: `Contract ${contractNumber} - PDF Document`,
    html,
    text,
    attachments: [
      {
        filename: `contract-${contractNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
