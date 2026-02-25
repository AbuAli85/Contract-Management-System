/**
 * WhatsApp Notification Service
 *
 * Handles WhatsApp notifications via Twilio WhatsApp API
 * Supports both template messages and free-form messages
 */

interface WhatsAppOptions {
  to: string | string[];
  message?: string; // For free-form messages (after 24h window)
  templateSid?: string; // Content Template SID for business-initiated messages
  templateVariables?: Record<string, string>; // Template variables
  from?: string;
}

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BulkWhatsAppResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Get Twilio client (lazy initialization)
 */
function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }

  try {
    const twilio = require('twilio');
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.error('Twilio package not installed. Run: npm install twilio');
    throw new Error('Twilio package not installed');
  }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(
  options: WhatsAppOptions
): Promise<WhatsAppResult> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('⚠️ Twilio not configured - WhatsApp will not be sent');
      return {
        success: false,
        error: 'WhatsApp service not configured',
      };
    }

    if (!process.env.TWILIO_WHATSAPP_FROM) {
      console.warn('⚠️ TWILIO_WHATSAPP_FROM not configured');
      return {
        success: false,
        error: 'Twilio WhatsApp sender number not configured',
      };
    }

    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // Format: whatsapp:+14155238886
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // Format recipient numbers (ensure whatsapp: prefix)
    const formattedRecipients = recipients.map(phone => {
      if (phone.startsWith('whatsapp:')) return phone;
      const formatted = formatPhoneNumber(phone);
      return `whatsapp:${formatted}`;
    });

    // Send to first recipient (Twilio supports one at a time)
    const recipient = formattedRecipients[0];

    const messageParams: any = {
      from: fromNumber,
      to: recipient,
    };

    // Use template if provided (for business-initiated messages)
    if (options.templateSid) {
      messageParams.contentSid = options.templateSid;
      if (options.templateVariables) {
        messageParams.contentVariables = JSON.stringify(
          options.templateVariables
        );
      }
    } else if (options.message) {
      // Free-form message (for user-initiated conversations within 24h window)
      // Add business name prefix if configured
      const businessName = process.env.WHATSAPP_BUSINESS_NAME || 'SmartPRO';
      const messageWithBrand = options.message.includes(businessName)
        ? options.message
        : `${businessName}\n\n${options.message}`;
      messageParams.body = messageWithBrand;
    } else {
      return {
        success: false,
        error: 'Either templateSid or message must be provided',
      };
    }

    const result = await client.messages.create(messageParams);

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('❌ WhatsApp send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Send bulk WhatsApp messages (with rate limiting consideration)
 */
export async function sendBulkWhatsApp(
  messages: WhatsAppOptions[]
): Promise<BulkWhatsAppResult> {
  const results: BulkWhatsAppResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches to avoid rate limits
  const batchSize = 5; // WhatsApp has stricter rate limits
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async message => {
        const result = await sendWhatsApp(message);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(
            `Failed to send WhatsApp to ${message.to}: ${result.error}`
          );
        }
      })
    );

    // Rate limiting: wait 2 seconds between batches (WhatsApp is stricter)
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Format phone number for WhatsApp (ensure E.164 format)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with 0, replace with country code (Oman: +968)
  if (digits.startsWith('0')) {
    return `+968${digits.substring(1)}`;
  }

  // If doesn't start with +, add country code
  if (!phone.startsWith('+')) {
    return `+968${digits}`;
  }

  return phone;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: +[country code][number]
  return /^\+[1-9]\d{1,14}$/.test(formatted);
}

/**
 * Check if WhatsApp is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}
