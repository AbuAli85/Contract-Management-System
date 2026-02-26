/**
 * Make.com Webhook Management System
 *
 * SECURITY: All webhook URLs are stored as server-only environment variables.
 * They must NEVER use the NEXT_PUBLIC_ prefix, as that would expose them to
 * the browser bundle. This file must only be imported from server-side code
 * (API routes, server actions, edge functions).
 */

export interface WebhookPayload {
  [key: string]: unknown;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export class MakeWebhookManager {
  // Server-only webhook URLs — no NEXT_PUBLIC_ prefix
  private static get webhooks() {
    return {
      serviceCreation: process.env.MAKE_SERVICE_CREATION_WEBHOOK,
      serviceApproval: process.env.MAKE_APPROVAL_WEBHOOK,
      bookingCreated: process.env.MAKE_BOOKING_CREATED_WEBHOOK,
      bookingCreatedAlt: process.env.MAKE_BOOKING_CREATED_ALT_WEBHOOK,
      trackingUpdated: process.env.MAKE_TRACKING_UPDATED_WEBHOOK,
      paymentSucceeded: process.env.MAKE_PAYMENT_SUCCEEDED_WEBHOOK,
      contractPdfReady: process.env.PDF_READY_WEBHOOK_URL,
      slackNotification: process.env.SLACK_WEBHOOK_URL,
      contractGeneral: process.env.MAKECOM_WEBHOOK_URL_GENERAL,
      contractSimple: process.env.MAKECOM_WEBHOOK_URL_SIMPLE,
    };
  }

  /**
   * Send a webhook to the specified endpoint with retry and timeout support.
   */
  static async sendWebhook(
    webhookType: keyof ReturnType<typeof MakeWebhookManager.webhooks>,
    payload: WebhookPayload,
    options?: {
      timeout?: number;
      retries?: number;
    }
  ): Promise<WebhookResponse> {
    const webhooks = this.webhooks;
    const webhookUrl = webhooks[webhookType];

    if (!webhookUrl) {
      return {
        success: false,
        message: `Webhook URL not configured for ${webhookType}`,
      };
    }

    const timeout = options?.timeout ?? 10000;
    const retries = options?.retries ?? 2;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;

      try {
        timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID(),
            'X-Webhook-Type': webhookType,
            'X-Attempt': String(attempt + 1),
          },
          body: JSON.stringify({
            ...payload,
            timestamp: new Date().toISOString(),
            webhook_type: webhookType,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json().catch(() => ({}));
          return {
            success: true,
            message: `${webhookType} webhook sent successfully`,
            data: result,
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        if (attempt === retries) {
          return {
            success: false,
            message: `Failed to send ${webhookType} webhook after ${retries + 1} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          };
        }

        // Exponential backoff before retry
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    return { success: false, message: `Failed to send ${webhookType} webhook` };
  }

  static async sendServiceCreation(payload: {
    service_id: string;
    provider_id: string;
    service_name: string;
    created_at: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('serviceCreation', payload);
  }

  static async sendServiceApproval(payload: {
    service_id: string;
    status: 'approved' | 'rejected';
    updated_at: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('serviceApproval', payload);
  }

  static async sendBookingCreated(payload: {
    booking_id: string;
    service_id: string;
    user_id: string;
    booking_date: string;
    status: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('bookingCreated', payload);
  }

  static async sendTrackingUpdated(payload: {
    tracking_id: string;
    status: string;
    location?: string;
    updated_at: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('trackingUpdated', payload);
  }

  static async sendPaymentSucceeded(payload: {
    payment_id: string;
    amount: number;
    currency: string;
    user_id: string;
    service_id?: string;
    booking_id?: string;
    payment_date: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('paymentSucceeded', payload);
  }

  /** Returns which webhooks are configured (without revealing URLs). */
  static getWebhookStatus(): Record<string, boolean> {
    const webhooks = this.webhooks;
    return Object.fromEntries(
      Object.entries(webhooks).map(([key, url]) => [key, !!url])
    );
  }
}

export const sendServiceCreation =
  MakeWebhookManager.sendServiceCreation.bind(MakeWebhookManager);
export const sendServiceApproval =
  MakeWebhookManager.sendServiceApproval.bind(MakeWebhookManager);
export const sendBookingCreated =
  MakeWebhookManager.sendBookingCreated.bind(MakeWebhookManager);
export const sendTrackingUpdated =
  MakeWebhookManager.sendTrackingUpdated.bind(MakeWebhookManager);
export const sendPaymentSucceeded =
  MakeWebhookManager.sendPaymentSucceeded.bind(MakeWebhookManager);
