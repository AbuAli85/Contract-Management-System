import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Docs Contract Generation Endpoint
 *
 * This endpoint now redirects all requests to the Make.com integration
 * to avoid Google Drive storage quota issues.
 *
 * The Make.com integration handles all Google Drive operations
 * using the user's personal Google Drive storage.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Redirecting to Make.com integration...');
    const body = await request.json();

    // Redirect to Make.com integration instead of direct Google Drive
    const makecomUrl = new URL('/api/contracts/makecom/generate', request.url);
    const makecomResponse = await fetch(makecomUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const result = await makecomResponse.json();

    return NextResponse.json(result, {
      status: makecomResponse.status,
      headers: {
        'X-Redirected-From': '/api/contracts/google-docs-generate',
        'X-Redirected-To': '/api/contracts/makecom/generate',
      },
    });
  } catch (error) {
    console.error('❌ Error redirecting to Make.com:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to redirect to Make.com integration',
        details: error instanceof Error ? error.message : 'Unknown error',
        solution:
          'Please use the Make.com integration endpoint directly: /api/contracts/makecom/generate',
      },
      { status: 500 }
    );
  }
}
