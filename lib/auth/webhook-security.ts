import crypto from 'crypto';

/**
 * Verify Stripe webhook signature
 * This ensures webhooks are actually from Stripe and haven't been tampered with
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const elements = signature.split(',');
    let timestamp: string | undefined;
    let v1: string | undefined;

    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        v1 = value;
      }
    }

    if (!timestamp || !v1) {
      console.error('Missing timestamp or signature in webhook');
      return false;
    }

    // Check timestamp (reject if older than 5 minutes)
    const webhookTimestamp = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - webhookTimestamp > 300) {
      console.error('Webhook timestamp too old');
      return false;
    }

    // Create expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Use crypto.timingSafeEqual to prevent timing attacks
    const signatureBuffer = Buffer.from(v1, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Verify generic webhook signature (HMAC SHA256)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Ensure consistent comparison
    const providedSignature = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Generate webhook signature for testing
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp?: number
): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${ts},v1=${signature}`;
}

/**
 * Rate limiting for webhooks (prevent replay attacks)
 */
const webhookTimestamps = new Set<string>();

export function isWebhookReplay(signature: string, windowMs: number = 300000): boolean {
  const elements = signature.split(',');
  const timestampElement = elements.find(el => el.startsWith('t='));
  
  if (!timestampElement) {
    return true; // No timestamp = potential replay
  }

  const timestamp = timestampElement.split('=')[1];
  
  if (!timestamp) {
    return true; // Invalid timestamp format
  }

  const webhookTime = parseInt(timestamp, 10) * 1000; // Convert to ms
  const now = Date.now();

  // Check if timestamp is within acceptable window
  if (now - webhookTime > windowMs) {
    return true; // Too old
  }

  // Check if we've seen this exact timestamp before
  if (webhookTimestamps.has(timestamp)) {
    return true; // Potential replay
  }

  // Add to seen timestamps
  webhookTimestamps.add(timestamp);

  // Clean up old timestamps (keep only last 5 minutes)
  const cutoff = Math.floor((now - windowMs) / 1000);
  for (const ts of webhookTimestamps) {
    if (parseInt(ts, 10) < cutoff) {
      webhookTimestamps.delete(ts);
    }
  }

  return false;
}
