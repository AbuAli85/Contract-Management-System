import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server'; // Fixed import path

interface VerifyParams {
  rawBody: string;
  signature: string;
  timestamp: string;
  idempotencyKey: string;
  secret: string;
}

export async function verifyWebhook(params: VerifyParams) {
  const { rawBody, signature, timestamp, idempotencyKey, secret } = params;

  // Timestamp validation
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) { // 5 minutes
    throw new Error('Invalid timestamp');
  }

  // HMAC validation
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.${rawBody}`);
  const expectedSignature = hmac.digest('hex');
  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  // Idempotency check
  const supabase = createClient();
  const { data } = await supabase
    .from('tracking_events')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (data) {
    return { verified: true, idempotent: true };
  }

  let parsedPayload;
  try {
    parsedPayload = JSON.parse(rawBody);
  } catch (e) {
    throw new Error('Invalid JSON payload');
  }

  return { verified: true, idempotent: false, payload: parsedPayload };
}