import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Report endpoint — receives violation reports from Content-Security-Policy-Report-Only header.
 * Logs violated-directive, blocked-uri, source-file, line-number for debugging.
 * Run in Report-Only mode for 48–72h before tightening enforced CSP.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const report = body['csp-report'] ?? body;

    const violatedDirective = report['violated-directive'] ?? report.violatedDirective ?? 'unknown';
    const blockedUri = report['blocked-uri'] ?? report.blockedUri ?? 'unknown';
    const sourceFile = report['source-file'] ?? report.sourceFile ?? '';
    const lineNumber = report['line-number'] ?? report.lineNumber ?? 0;
    const documentUri = report['document-uri'] ?? report.documentUri ?? '';

    // Log for monitoring (aggregate in production via your logging pipeline)
    console.warn('[CSP Report]', {
      violatedDirective,
      blockedUri,
      sourceFile,
      lineNumber,
      documentUri,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store aggregated counts in Supabase (e.g. csp_violations table) for dashboards
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
