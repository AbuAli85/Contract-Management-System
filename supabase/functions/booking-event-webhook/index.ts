import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Booking event webhook trigger
// This Edge Function is triggered by a database trigger on INSERT to booking_events
serve(async req => {
  try {
    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload = await req.json();
    console.log('📨 Booking event trigger received:', payload);

    // Extract the booking event from the payload
    const bookingEvent = payload.record;

    if (!bookingEvent) {
      console.error('❌ No booking event record in payload');
      return new Response('Invalid payload', { status: 400 });
    }

    // Get the Next.js app URL from environment
    const appUrl =
      Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3001';
    const webhookUrl = `${appUrl}/api/webhooks/booking-events`;
    const webhookSecret = Deno.env.get('SUPABASE_WEBHOOK_SECRET');

    console.log(`🚀 Forwarding event to Next.js app: ${webhookUrl}`);

    // Forward the event to the Next.js API route
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
        ...(webhookSecret && {
          Authorization: `Bearer ${webhookSecret}`,
        }),
      },
      body: JSON.stringify({
        record: bookingEvent,
        table: 'booking_events',
        event_type: 'INSERT',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Failed to forward to Next.js app: ${response.status} ${errorText}`
      );
      return new Response(`Failed to forward event: ${response.status}`, {
        status: 500,
      });
    }

    const result = await response.json();
    console.log('✅ Event forwarded successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        forwarded_to: webhookUrl,
        result: result,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
