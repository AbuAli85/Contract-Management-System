import { BookingEventPayload } from '@/lib/realtime/booking-subscriptions';

// Make.com webhook configuration
interface MakeWebhookConfig {
  url: string;
  secret?: string;
  enabled: boolean;
  retryAttempts: number;
  timeout: number;
}

// Default configuration
const defaultConfig: MakeWebhookConfig = {
  url: process.env.MAKE_WEBHOOK_URL || '',
  secret: process.env.MAKE_WEBHOOK_SECRET,
  enabled: !!process.env.MAKE_WEBHOOK_URL,
  retryAttempts: 3,
  timeout: 10000, // 10 seconds
};

// Enhanced payload for Make.com
export interface MakeWebhookPayload {
  // Event metadata
  event_id: string;
  event_type: string;
  event_time: string;
  source: 'contract-management-system';

  // Booking event data
  booking_event: BookingEventPayload;

  // Additional context
  booking_details?: {
    id: string;
    booking_number: string;
    client_id: string;
    provider_id: string;
    service_id: string;
    status: string;
    scheduled_start: string;
    scheduled_end: string;
    total_price: number;
    currency: string;
  };

  // User context
  client_info?: {
    id: string;
    name: string;
    email: string;
  };

  provider_info?: {
    id: string;
    name: string;
    email: string;
    company_name?: string;
  };

  service_info?: {
    id: string;
    name: string;
    category: string;
    price_base: number;
  };

  // System metadata
  system: {
    environment: string;
    timestamp: string;
    user_agent?: string;
    ip_address?: string;
  };
}

/**
 * Send booking event to Make.com webhook
 */
export async function sendToMakeWebhook(
  eventPayload: BookingEventPayload,
  additionalData: Partial<MakeWebhookPayload> = {},
  config: Partial<MakeWebhookConfig> = {}
): Promise<{ success: boolean; error?: string }> {
  const webhookConfig = { ...defaultConfig, ...config };

  if (!webhookConfig.enabled || !webhookConfig.url) {
    return { success: true }; // Not an error if not configured
  }

  try {
    const payload: MakeWebhookPayload = {
      event_id: eventPayload.id,
      event_type: eventPayload.event_type,
      event_time: eventPayload.created_at,
      source: 'contract-management-system',
      booking_event: eventPayload,
      system: {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        user_agent: eventPayload.user_agent,
        ip_address: eventPayload.ip_address,
      },
      ...additionalData,
    };

    const response = await fetch(webhookConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contract-Management-System/1.0',
        ...(webhookConfig.secret && {
          'X-Webhook-Secret': webhookConfig.secret,
        }),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(webhookConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.text();

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Send booking event with retry logic
 */
export async function sendToMakeWebhookWithRetry(
  eventPayload: BookingEventPayload,
  additionalData: Partial<MakeWebhookPayload> = {},
  config: Partial<MakeWebhookConfig> = {}
): Promise<{ success: boolean; error?: string; attempts: number }> {
  const webhookConfig = { ...defaultConfig, ...config };
  let lastError: string = '';

  for (let attempt = 1; attempt <= webhookConfig.retryAttempts; attempt++) {
    const result = await sendToMakeWebhook(
      eventPayload,
      additionalData,
      webhookConfig
    );

    if (result.success) {
      if (attempt > 1) {
      }
      return { success: true, attempts: attempt };
    }

    lastError = result.error || 'Unknown error';

    // Wait before retry (exponential backoff)
    if (attempt < webhookConfig.retryAttempts) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, etc.
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: webhookConfig.retryAttempts,
  };
}

/**
 * Validate Make.com webhook configuration
 */
export function validateMakeWebhookConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.MAKE_WEBHOOK_URL) {
    warnings.push(
      'MAKE_WEBHOOK_URL not configured - webhook integration disabled'
    );
  } else {
    try {
      new URL(process.env.MAKE_WEBHOOK_URL);
    } catch {
      errors.push('MAKE_WEBHOOK_URL is not a valid URL');
    }
  }

  if (!process.env.MAKE_WEBHOOK_SECRET) {
    warnings.push(
      'MAKE_WEBHOOK_SECRET not configured - webhook security reduced'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test Make.com webhook connectivity
 */
export async function testMakeWebhook(): Promise<{
  success: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();

  const testPayload: BookingEventPayload = {
    id: `test_${Date.now()}`,
    booking_id: 'test-booking-id',
    event_type: 'webhook_test',
    description: 'Test webhook connectivity',
    created_at: new Date().toISOString(),
  };

  const result = await sendToMakeWebhook(testPayload, {
    system: {
      environment: 'test',
      timestamp: new Date().toISOString(),
    },
  });

  return {
    success: result.success,
    responseTime: Date.now() - startTime,
    error: result.error,
  };
}

/**
 * Get webhook statistics
 */
export interface WebhookStats {
  totalSent: number;
  successfulSent: number;
  failedSent: number;
  averageResponseTime: number;
  lastSentAt?: string;
  lastError?: string;
}

// Simple in-memory stats (in production, use Redis or database)
let webhookStats: WebhookStats = {
  totalSent: 0,
  successfulSent: 0,
  failedSent: 0,
  averageResponseTime: 0,
};

/**
 * Update webhook statistics
 */
export function updateWebhookStats(
  success: boolean,
  responseTime: number,
  error?: string
) {
  webhookStats.totalSent++;
  webhookStats.lastSentAt = new Date().toISOString();

  if (success) {
    webhookStats.successfulSent++;
  } else {
    webhookStats.failedSent++;
    webhookStats.lastError = error;
  }

  // Update average response time
  webhookStats.averageResponseTime =
    (webhookStats.averageResponseTime * (webhookStats.totalSent - 1) +
      responseTime) /
    webhookStats.totalSent;
}

/**
 * Get current webhook statistics
 */
export function getWebhookStats(): WebhookStats {
  return { ...webhookStats };
}

/**
 * Reset webhook statistics
 */
export function resetWebhookStats() {
  webhookStats = {
    totalSent: 0,
    successfulSent: 0,
    failedSent: 0,
    averageResponseTime: 0,
  };
}

/**
 * Batch send multiple events to Make.com
 */
export async function batchSendToMakeWebhook(
  events: BookingEventPayload[],
  batchSize: number = 10,
  delayBetweenBatches: number = 1000
): Promise<{
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  errors: string[];
}> {
  const results = {
    totalEvents: events.length,
    successfulEvents: 0,
    failedEvents: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    const batchPromises = batch.map(async event => {
      const result = await sendToMakeWebhookWithRetry(event);

      if (result.success) {
        results.successfulEvents++;
      } else {
        results.failedEvents++;
        results.errors.push(`Event ${event.id}: ${result.error}`);
      }

      return result;
    });

    await Promise.allSettled(batchPromises);

    // Delay between batches to avoid overwhelming the webhook
    if (i + batchSize < events.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}
