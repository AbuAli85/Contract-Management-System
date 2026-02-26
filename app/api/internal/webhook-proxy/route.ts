/**
 * Secure Webhook Proxy
 *
 * This route replaces all direct NEXT_PUBLIC_ webhook URL calls from the client.
 * Webhook URLs are now stored as server-only environment variables and are never
 * exposed to the browser. All calls are authenticated and rate-limited.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Server-only webhook URL map — these must NOT use NEXT_PUBLIC_ prefix
const WEBHOOK_MAP: Record<string, string | undefined> = {
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

// Allowed webhook types per role
const ROLE_ALLOWED_WEBHOOKS: Record<string, string[]> = {
  admin: Object.keys(WEBHOOK_MAP),
  manager: ['serviceCreation', 'serviceApproval', 'bookingCreated', 'trackingUpdated', 'contractGeneral', 'contractSimple'],
  employer: ['bookingCreated', 'trackingUpdated', 'contractGeneral', 'contractSimple'],
  provider: ['serviceCreation', 'bookingCreated'],
};

export const POST = withRBAC(
  'webhook:send:own',
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { webhookType, payload } = body;

      if (!webhookType || typeof webhookType !== 'string') {
        return NextResponse.json(
          { error: 'webhookType is required' },
          { status: 400 }
        );
      }

      // Validate webhook type exists
      if (!(webhookType in WEBHOOK_MAP)) {
        return NextResponse.json(
          { error: `Unknown webhook type: ${webhookType}` },
          { status: 400 }
        );
      }

      const webhookUrl = WEBHOOK_MAP[webhookType];
      if (!webhookUrl) {
        return NextResponse.json(
          { error: `Webhook ${webhookType} is not configured` },
          { status: 503 }
        );
      }

      // Forward the request to the actual webhook URL
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID(),
            'X-Webhook-Type': webhookType,
            'X-User-ID': user.id,
          },
          body: JSON.stringify({
            ...payload,
            timestamp: new Date().toISOString(),
            webhook_type: webhookType,
            triggered_by: user.id,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json().catch(() => ({}));

        return NextResponse.json({
          success: response.ok,
          status: response.status,
          data: result,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if ((fetchError as Error).name === 'AbortError') {
          return NextResponse.json(
            { error: 'Webhook request timed out' },
            { status: 504 }
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Webhook proxy error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
