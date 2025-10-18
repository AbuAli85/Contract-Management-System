import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Make.com configuration...');

    // Check environment variables
    const makecomWebhookUrl = process.env.MAKECOM_WEBHOOK_URL;
    const hasWebhookUrl = !!makecomWebhookUrl;

    // Check if webhook URL is a placeholder
    const isPlaceholder = makecomWebhookUrl?.includes('your-webhook-id') || 
                         makecomWebhookUrl?.includes('YOUR_WEBHOOK_ID') ||
                         makecomWebhookUrl?.includes('placeholder');

    // Test webhook URL format
    const isValidFormat = makecomWebhookUrl?.startsWith('https://hook.make.com/') ||
                         makecomWebhookUrl?.startsWith('https://hook.eu2.make.com/');

    // Get available contract types
    const contractTypes = [
      'full-time-permanent',
      'part-time-contract', 
      'fixed-term-contract',
      'business-service-contract',
      'consulting-agreement',
      'freelance-service-agreement',
      'business-partnership-agreement',
      'non-disclosure-agreement',
      'vendor-service-agreement'
    ];

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        MAKECOM_WEBHOOK_URL: {
          exists: hasWebhookUrl,
          value: hasWebhookUrl ? makecomWebhookUrl : 'NOT_SET',
          isPlaceholder,
          isValidFormat: hasWebhookUrl ? isValidFormat : false,
          length: makecomWebhookUrl?.length || 0
        }
      },
      configuration: {
        webhookConfigured: hasWebhookUrl && !isPlaceholder && isValidFormat,
        availableContractTypes: contractTypes.length,
        contractTypes: contractTypes
      },
      recommendations: {
        missingConfig: !hasWebhookUrl ? ['MAKECOM_WEBHOOK_URL'] : [],
        issues: [
          ...(isPlaceholder ? ['Webhook URL contains placeholder text'] : []),
          ...(hasWebhookUrl && !isValidFormat ? ['Webhook URL format is invalid'] : [])
        ],
        nextSteps: [
          ...(hasWebhookUrl && !isPlaceholder && isValidFormat ? [] : [
            '1. Create Make.com scenario with webhook trigger',
            '2. Copy the webhook URL from Make.com',
            '3. Set MAKECOM_WEBHOOK_URL environment variable',
            '4. Deploy to production'
          ]),
          '5. Test webhook integration',
          '6. Verify contract generation workflow'
        ]
      }
    };

    return NextResponse.json({
      status: 'success',
      message: 'Make.com configuration diagnostics completed',
      domain: "protal.thesmartpro.io",
      diagnostics
    });

  } catch (error) {
    console.error('❌ Make.com config check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Make.com configuration check failed',
        domain: "protal.thesmartpro.io",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
