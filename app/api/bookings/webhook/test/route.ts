import { NextRequest, NextResponse } from 'next/server';
import { triggerWebhook } from '@/lib/webhook-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, test_data } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing webhook for event: ${event}`);

    // Create test data based on event type
    let testData = test_data || {};

    switch (event) {
      case 'booking.created':
        testData = {
          booking_id: 'test-booking-id',
          booking_number: `TEST-${Date.now()}`,
          service_id: 'test-service-id',
          client_id: 'test-client-id',
          provider_id: 'test-provider-id',
          client_email: 'test@example.com',
          client_name: 'Test Client',
          scheduled_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          scheduled_end: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
          quoted_price: 150.0,
          status: 'pending',
          created_at: new Date().toISOString(),
          ...testData,
        };
        break;

      case 'booking.status_changed':
        testData = {
          booking_id: 'test-booking-id',
          booking_number: `TEST-${Date.now()}`,
          old_status: 'pending',
          new_status: 'confirmed',
          client_email: 'test@example.com',
          provider_id: 'test-provider-id',
          service_id: 'test-service-id',
          updated_at: new Date().toISOString(),
          ...testData,
        };
        break;

      case 'service.created':
        testData = {
          service_id: 'test-service-id',
          provider_id: 'test-provider-id',
          title: 'Test Service',
          category: 'consulting',
          subcategory: 'business',
          base_price: 100.0,
          currency: 'USD',
          status: 'active',
          location_type: 'online',
          created_at: new Date().toISOString(),
          ...testData,
        };
        break;

      case 'user.registered':
        testData = {
          user_id: 'test-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'client',
          status: 'active',
          company_name: 'Test Company',
          business_type: 'technology',
          created_at: new Date().toISOString(),
          ...testData,
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported test event: ${event}` },
          { status: 400 }
        );
    }

    // Add test metadata
    testData.test_mode = true;
    testData.test_timestamp = new Date().toISOString();
    testData.test_source = 'webhook-test-endpoint';

    // Trigger the webhook
    const result = await triggerWebhook({
      event,
      data: testData,
    });

    return NextResponse.json({
      success: true,
      event,
      test_data: testData,
      webhook_result: result,
      message: `Test webhook for '${event}' ${result.success ? 'succeeded' : 'failed'}`,
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const event = searchParams.get('event');

  if (event) {
    // Test specific event
    return POST(
      new NextRequest(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      })
    );
  }

  // Return available test events
  return NextResponse.json({
    message: 'Webhook Test Endpoint',
    available_events: [
      'booking.created',
      'booking.status_changed',
      'service.created',
      'user.registered',
    ],
    usage: {
      POST: 'Send { "event": "event_name", "test_data": {...} } to test webhook',
      GET: 'Add ?event=event_name to test specific event',
    },
    examples: {
      'Test booking creation':
        'GET /api/bookings/webhook/test?event=booking.created',
      'Test status change':
        'GET /api/bookings/webhook/test?event=booking.status_changed',
      'Custom test data':
        'POST /api/bookings/webhook/test with { "event": "booking.created", "test_data": { "client_name": "Custom Name" } }',
    },
  });
}
