import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_CONTENT_TYPES = ['application/csp-report', 'application/json'];
const SAMPLE_RATE = 10; // Log 1 in N reports per key to reduce noise
const IN_MEMORY_LIMIT = 100; // Max reports per minute per key (lightweight)
const inMemoryCounts = new Map<string, { count: number; resetAt: number }>();

function normalizeUri(uri: string): string {
  if (!uri || uri === 'unknown') return uri;
  try {
    const url = new URL(uri);
    url.search = '';
    let normalized = url.toString();
    if (normalized.startsWith('chrome-extension://') || normalized.startsWith('moz-extension://') || normalized.startsWith('safari-extension://')) {
      return normalized.split('/').slice(0, 4).join('/') + '/*';
    }
    return normalized;
  } catch {
    return uri;
  }
}

function extractHost(uri: string): string {
  if (!uri || uri === 'unknown') return uri;
  try {
    const url = new URL(uri);
    return url.hostname || uri;
  } catch {
    return uri;
  }
}

function shouldSample(key: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const record = inMemoryCounts.get(key);
  if (!record) {
    inMemoryCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (now > record.resetAt) {
    inMemoryCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  record.count++;
  if (record.count > IN_MEMORY_LIMIT) return false;
  return record.count % SAMPLE_RATE === 1;
}

/**
 * CSP Report endpoint — receives violation reports from Content-Security-Policy-Report-Only.
 * Lightweight: method/Content-Type validation, in-memory sampling, normalized URIs.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim();
  if (!contentType || !ALLOWED_CONTENT_TYPES.some(t => contentType === t)) {
    return new NextResponse(null, { status: 415 });
  }

  try {
    const body = await request.json();
    const report = body['csp-report'] ?? body;

    const violatedDirective = report['violated-directive'] ?? report.violatedDirective ?? 'unknown';
    const blockedUri = report['blocked-uri'] ?? report.blockedUri ?? 'unknown';
    const sourceFile = report['source-file'] ?? report.sourceFile ?? '';
    const lineNumber = report['line-number'] ?? report.lineNumber ?? 0;
    const documentUri = report['document-uri'] ?? report.documentUri ?? '';

    const normalizedBlocked = normalizeUri(blockedUri);
    const normalizedDocument = normalizeUri(documentUri);

    // Skip extension noise entirely (don't log)
    if (normalizedBlocked.includes('extension://') || normalizedDocument.includes('extension://')) {
      return new NextResponse(null, { status: 204 });
    }

    const sampleKey = `${normalizedBlocked}:${violatedDirective}`;
    if (!shouldSample(sampleKey)) {
      return new NextResponse(null, { status: 204 });
    }

    const blockedHost = extractHost(blockedUri);
    console.warn('[CSP Report]', {
      violatedDirective,
      blockedHost, // For aggregation: top offenders by host
      blockedUri: normalizedBlocked, // Full URL for debugging
      sourceFile,
      lineNumber,
      documentUri: normalizedDocument,
      timestamp: new Date().toISOString(),
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
