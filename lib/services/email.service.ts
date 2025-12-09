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

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'noreply@portal.thesmartpro.io';
    const fromName =
      process.env.RESEND_FROM_NAME || 'SmartPro Contract Management System';

    const { data, error } = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      ...(options.replyTo && { replyTo: options.replyTo }),
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
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
