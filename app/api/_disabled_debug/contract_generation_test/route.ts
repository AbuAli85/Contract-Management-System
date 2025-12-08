import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Test endpoint without RBAC for debugging
export async function POST(request: Request): Promise<NextResponse> {
  const startTime = Date.now();
  const TIMEOUT_MS = 80000; // 80 seconds timeout

  try {
    // Set up timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Contract generation timeout')),
        TIMEOUT_MS
      );
    });

    const processPromise = (async () => {
      // Parse request body
      const body = await request.json();

      // Authenticate user
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log('Auth check result:', { user: !!user, authError });

      if (authError || !user) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            details: authError?.message || 'No user found',
            debug: {
              hasUser: !!user,
              authError: authError?.message,
            },
          },
          { status: 401 }
        );
      }

      // PDF Generation API URL
      const PDF_API_URL = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/pdf-generation`
        : '/api/pdf-generation';

      // If PDF_API_URL is relative, we need to construct full URL for server-side fetch
      const apiUrl = PDF_API_URL.startsWith('http')
        ? PDF_API_URL
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${PDF_API_URL}`;

      console.log('Calling PDF API:', apiUrl);

      const pdfRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!pdfRes.ok) {
        const errorText = await pdfRes.text();
        console.error('PDF generation failed:', errorText);
        return NextResponse.json(
          { error: 'Failed to generate PDF', details: errorText },
          { status: 500 }
        );
      }

      const pdfResult = await pdfRes.json();
      const pdfUrl = pdfResult.pdf_url;

      if (!pdfUrl) {
        return NextResponse.json(
          { error: 'PDF URL missing from generation response' },
          { status: 500 }
        );
      }

      // Update contract record in Supabase
      const { contractId } = body;
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ pdf_url: pdfUrl, status: 'completed', updated_by: user.id })
        .eq('id', contractId);

      if (updateError) {
        console.error('Contract update error:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update contract with PDF URL',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // Return PDF URL
      return NextResponse.json({
        pdf_url: pdfUrl,
        processing_time: Date.now() - startTime,
        user_id: user.id,
        contract_id: contractId,
      });
    })();

    // Race between processing and timeout
    const result = await Promise.race([processPromise, timeoutPromise]);
    return result as NextResponse;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Contract generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: (error as Error).message,
        processing_time: processingTime,
        timeout: error instanceof Error && error.message.includes('timeout'),
      },
      { status: 500 }
    );
  }
}
