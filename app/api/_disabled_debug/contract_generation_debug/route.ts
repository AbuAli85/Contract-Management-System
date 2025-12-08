import { NextResponse } from 'next/server';

// Debug endpoint to test without authentication
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    // PDF Generation API URL
    const PDF_API_URL = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/pdf-generation`
      : '/api/pdf-generation';

    // If PDF_API_URL is relative, we need to construct full URL for server-side fetch
    const apiUrl = PDF_API_URL.startsWith('http')
      ? PDF_API_URL
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${PDF_API_URL}`;

    console.log('Calling PDF API:', apiUrl);
    console.log('Request body:', body);

    // Use debug PDF generation endpoint instead
    const debugApiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/pdf-generation/debug`;

    const pdfRes = await fetch(debugApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!pdfRes.ok) {
      const errorText = await pdfRes.text();
      console.error('PDF generation failed:', errorText);
      return NextResponse.json(
        {
          error: 'Failed to generate PDF',
          details: errorText,
          status: pdfRes.status,
        },
        { status: 500 }
      );
    }

    const pdfResult = await pdfRes.json();

    // Extract PDF URL from result
    const pdfUrl = pdfResult.pdf_base64
      ? `data:application/pdf;base64,${pdfResult.pdf_base64}`
      : null;

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL missing from generation response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pdf_url: pdfUrl,
      pdf_result: pdfResult,
      api_url: debugApiUrl,
      environment: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}
