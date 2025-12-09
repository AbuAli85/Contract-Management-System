// Make.com Webhook Management System
// Centralized configuration for all webhook endpoints

export interface WebhookPayload {
  [key: string]: any;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class MakeWebhookManager {
  private static webhooks = {
    // Service Management
    serviceCreation: process.env.NEXT_PUBLIC_MAKE_SERVICE_CREATION_WEBHOOK,
    serviceApproval: process.env.NEXT_PUBLIC_MAKE_APPROVAL_WEBHOOK,

    // Booking System
    bookingCreated: process.env.NEXT_PUBLIC_MAKE_BOOKING_CREATED_WEBHOOK,
    bookingCreatedAlt: process.env.NEXT_PUBLIC_MAKE_BOOKING_CREATED_ALT_WEBHOOK,

    // Tracking
    trackingUpdated: process.env.NEXT_PUBLIC_MAKE_TRACKING_UPDATED_WEBHOOK,

    // Payments
    paymentSucceeded: process.env.NEXT_PUBLIC_MAKE_PAYMENT_SUCCEEDED_WEBHOOK,
  };

  /**
   * Send a webhook to the specified endpoint
   */
  static async sendWebhook(
    webhookType: keyof typeof MakeWebhookManager.webhooks,
    payload: WebhookPayload,
    options?: {
      timeout?: number;
      retries?: number;
    }
  ): Promise<WebhookResponse> {
    const webhookUrl = this.webhooks[webhookType];

    if (!webhookUrl) {
      return {
        success: false,
        message: `Webhook URL not configured for ${webhookType}`,
      };
    }

    const timeout = options?.timeout || 10000; // 10 seconds
    const retries = options?.retries || 2;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;

      try {
        console.log(
          `🔗 Sending ${webhookType} webhook (attempt ${attempt + 1}):`,
          payload
        );

        timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID(),
            'X-Webhook-Type': webhookType,
            'X-Attempt': (attempt + 1).toString(),
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
          console.log(`✅ ${webhookType} webhook successful:`, result);

          return {
            success: true,
            message: `${webhookType} webhook sent successfully`,
            data: result,
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.error(
          `❌ ${webhookType} webhook failed (attempt ${attempt + 1}):`,
          error
        );

        if (attempt === retries) {
          return {
            success: false,
            message: `Failed to send ${webhookType} webhook after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    return {
      success: false,
      message: `Failed to send ${webhookType} webhook`,
    };
  }

  /**
   * Send service creation webhook
   */
  static async sendServiceCreation(payload: {
    service_id: string;
    provider_id: string;
    service_name: string;
    created_at: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('serviceCreation', payload);
  }

  /**
   * Send service approval webhook
   */
  static async sendServiceApproval(payload: {
    service_id: string;
    status: 'approved' | 'rejected';
    updated_at: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('serviceApproval', payload);
  }

  /**
   * Send booking created webhook
   */
  static async sendBookingCreated(payload: {
    booking_id: string;
    service_id: string;
    user_id: string;
    booking_date: string;
    status: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('bookingCreated', payload);
  }

  /**
   * Send tracking updated webhook
   */
  static async sendTrackingUpdated(payload: {
    tracking_id: string;
    status: string;
    location?: string;
    updated_at: string;
  }): Promise<WebhookResponse> {
    return this.sendWebhook('trackingUpdated', payload);
  }

  /**
   * Send payment succeeded webhook
   */
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

  /**
   * Get webhook status (check if URLs are configured)
   */
  static getWebhookStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};

    Object.entries(this.webhooks).forEach(([key, url]) => {
      status[key] = !!url && url !== '';
    });

    return status;
  }

  /**
   * Get all configured webhook URLs
   */
  static getWebhookUrls(): Record<string, string | undefined> {
    return { ...this.webhooks };
  }
}

// Convenience functions for common webhook operations
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
