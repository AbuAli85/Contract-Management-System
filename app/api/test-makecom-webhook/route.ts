import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Make.com webhook...')
    
    const body = await request.json()
    console.log('📤 Test payload:', body)

    // Simulate the webhook payload that would be sent to Make.com
    const testPayload = {
      contract_id: body.contract_id || 'test-contract-id',
      contract_number: body.contract_number || 'PAC-TEST-001',
      contract_type: body.contract_type || 'full-time-permanent'
    }

    const makecomWebhookUrl = process.env.MAKE_WEBHOOK_URL
    if (!makecomWebhookUrl) {
      return NextResponse.json({
        success: false,
        error: 'MAKE_WEBHOOK_URL not configured'
      }, { status: 400 })
    }

    console.log('🔗 Sending test to Make.com webhook:', makecomWebhookUrl)

    const response = await fetch(makecomWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })

    console.log('🔗 Make.com response status:', response.status, response.statusText)
    console.log('🔗 Make.com response headers:', Object.fromEntries(response.headers.entries()))

    // Handle different response types
    const contentType = response.headers.get('content-type')
    let responseData = null

    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json()
        console.log('✅ Make.com JSON response:', responseData)
      } catch (jsonError) {
        console.log('⚠️ Make.com response is not valid JSON')
        responseData = { error: 'Invalid JSON response' }
      }
    } else {
      const textResponse = await response.text()
      console.log('✅ Make.com text response:', textResponse)
      responseData = { text: textResponse }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      webhookUrl: makecomWebhookUrl,
      sentPayload: testPayload,
      response: responseData
    })

  } catch (error) {
    console.error('❌ Make.com webhook test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  const makecomWebhookUrl = process.env.MAKE_WEBHOOK_URL
  
  return NextResponse.json({
    success: true,
    message: 'Make.com webhook test endpoint is active',
    webhookConfigured: !!makecomWebhookUrl,
    webhookUrl: makecomWebhookUrl ? '***configured***' : 'not configured',
    timestamp: new Date().toISOString()
  })
} 