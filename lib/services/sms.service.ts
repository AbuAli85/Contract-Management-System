/**
 * SMS Notification Service
 *
 * Handles SMS notifications via Twilio
 * Supports both individual and bulk SMS sending
 */

interface SMSOptions {
  to: string | string[];
  message: string;
  from?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BulkSMSResult {
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

  // Dynamic import to avoid errors if Twilio is not installed
  try {
    const twilio = require('twilio');
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    throw new Error('Twilio package not installed');
  }
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: 'Twilio phone number not configured',
      };
    }

    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // Send to first recipient (Twilio supports one at a time)
    const result = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: recipients[0],
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send bulk SMS (with rate limiting consideration)
 */
export async function sendBulkSMS(
  messages: SMSOptions[]
): Promise<BulkSMSResult> {
  const results: BulkSMSResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async message => {
        const result = await sendSMS(message);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(
            `Failed to send SMS to ${message.to}: ${result.error}`
          );
        }
      })
    );

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Format phone number for Twilio (ensure E.164 format)
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
