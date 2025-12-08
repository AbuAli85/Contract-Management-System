import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Reporting Endpoint
 *
 * This endpoint receives and logs Content Security Policy violations
 * to help identify security issues and misconfigurations.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */

interface CSPReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'status-code': number;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse CSP violation report
    const report: CSPReport = await request.json();
    const violation = report['csp-report'];

    // Log the violation (in production, send to monitoring service)
    console.warn('🚨 CSP Violation Report:', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      timestamp: new Date().toISOString(),
    });

    // TODO: In production, send to monitoring service
    // Examples:
    // - Send to Sentry
    // - Send to Datadog
    // - Store in database for analysis
    // - Send to Report URI service

    // Example Sentry integration:
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureMessage('CSP Violation', {
    //     level: 'warning',
    //     extra: violation,
    //   });
    // }

    // Example database logging:
    // if (process.env.LOG_CSP_TO_DB === 'true') {
    //   await supabase.from('csp_violations').insert({
    //     document_uri: violation['document-uri'],
    //     violated_directive: violation['violated-directive'],
    //     blocked_uri: violation['blocked-uri'],
    //     source_file: violation['source-file'],
    //     line_number: violation['line-number'],
    //     created_at: new Date().toISOString(),
    //   });
    // }

    return NextResponse.json({ received: true }, { status: 204 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return NextResponse.json(
      { error: 'Invalid report format' },
      { status: 400 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
