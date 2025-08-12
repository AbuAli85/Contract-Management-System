import { createClient } from '@/lib/supabase/client';
import { WebhookType } from '@/types/webhooks';

interface WebhookConfig {
  serviceCreation: string | undefined;
  bookingCreated: string | undefined;
  trackingUpdated: string | undefined;
  paymentSucceeded: string | undefined;
}

const webhookUrls: WebhookConfig = {
  serviceCreation: process.env.MAKE_SERVICE_CREATION_WEBHOOK,
  bookingCreated: process.env.MAKE_BOOKING_CREATED_WEBHOOK,
  trackingUpdated: process.env.MAKE_TRACKING_UPDATED_WEBHOOK,
  paymentSucceeded: process.env.MAKE_PAYMENT_SUCCEEDED_WEBHOOK,
};

interface WebhookLogEntry {
  type: string;
  payload: any;
  error?: string;
  attempts: number;
}

async function logWebhookToDatabase(logEntry: WebhookLogEntry): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('webhook_logs').insert({
      type: logEntry.type,
      payload: logEntry.payload,
      error: logEntry.error,
      attempts: logEntry.attempts,
    });
  } catch (error) {
    console.error('Failed to log webhook to database:', error);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function dispatchWebhook(
  type: WebhookType,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = webhookUrls[type];

  if (!webhookUrl) {
    const error = `Webhook URL not configured for type: ${type}`;
    await logWebhookToDatabase({
      type,
      payload,
      error,
      attempts: 1,
    });
    return { success: false, error };
  }

  const maxAttempts = 3;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `🔗 Sending ${type} webhook (attempt ${attempt}/${maxAttempts}):`,
        payload
      );

      const webhookSecret = process.env.WEBHOOK_SECRET;
      const signature = webhookSecret
        ? Buffer.from(JSON.stringify(payload) + webhookSecret).toString(
            'base64'
          )
        : undefined;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature || '',
          'X-Webhook-Type': type,
          'X-Attempt': attempt.toString(),
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          webhook_type: type,
        }),
      });

      if (response.ok) {
        console.log(`✅ ${type} webhook successful on attempt ${attempt}`);

        // Log successful dispatch
        await logWebhookToDatabase({
          type,
          payload,
          attempts: attempt,
        });

        return { success: true };
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        lastError = `HTTP ${response.status}: ${errorText}`;
        console.error(
          `❌ ${type} webhook failed (attempt ${attempt}):`,
          lastError
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error';
      console.error(
        `❌ ${type} webhook failed (attempt ${attempt}):`,
        lastError
      );
    }

    // If this wasn't the last attempt, wait before retrying
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  // All attempts failed, log the final error
  await logWebhookToDatabase({
    type,
    payload,
    error: lastError,
    attempts: maxAttempts,
  });

  return {
    success: false,
    error: `Failed to send ${type} webhook after ${maxAttempts} attempts: ${lastError}`,
  };
}

// Convenience functions for each webhook type
export async function dispatchServiceCreation(payload: any) {
  return dispatchWebhook('serviceCreation', payload);
}

export async function dispatchBookingCreated(payload: any) {
  return dispatchWebhook('bookingCreated', payload);
}

export async function dispatchTrackingUpdated(payload: any) {
  return dispatchWebhook('trackingUpdated', payload);
}

export async function dispatchPaymentSucceeded(payload: any) {
  return dispatchWebhook('paymentSucceeded', payload);
}
