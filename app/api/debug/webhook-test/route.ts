import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Webhook Debug Test - Headers and Body Analysis');
    
    // Get all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Get raw body
    const rawBody = await request.text();
    
    // Try to parse JSON
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e);
    }
    
    // Check environment variables
    const envCheck = {
      MAKE_WEBHOOK_SECRET: process.env.MAKE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    };
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      headers,
      rawBody,
      parsedBody,
      envCheck,
      analysis: {
        hasWebhookSecret: !!headers['x-webhook-secret'],
        hasSignature: !!headers['x-signature'],
        hasTimestamp: !!headers['x-timestamp'],
        hasIdempotencyKey: !!headers['x-idempotency-key'],
        contentType: headers['content-type'],
        bodyLength: rawBody.length,
        isJsonValid: !!parsedBody,
      }
    };
    
    console.log('📊 Debug Info:', JSON.stringify(debugInfo, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Webhook debug test completed',
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Webhook debug test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Debug test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook Debug Test Endpoint',
    usage: 'Send a POST request to test webhook headers and body parsing',
    example: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'your_secret_here'
      },
      body: {
        contract_id: 'test-001',
        contract_number: 'TEST-001',
        contract_type: 'full-time-permanent'
      }
    }
  });
}
