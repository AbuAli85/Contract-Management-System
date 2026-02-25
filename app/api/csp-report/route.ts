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

    // Log to database if configured
    if (process.env.LOG_CSP_TO_DB === 'true') {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        await supabase.from('csp_violations').insert({
          document_uri: violation['document-uri'],
          violated_directive: violation['violated-directive'],
          blocked_uri: violation['blocked-uri'],
          source_file: violation['source-file'],
          line_number: violation['line-number'],
          column_number: violation['column-number'],
          created_at: new Date().toISOString(),
        });
      } catch {
        // Do not fail the request if DB logging fails
      }
    }

    return NextResponse.json({ received: true }, { status: 204 });
  } catch {
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
