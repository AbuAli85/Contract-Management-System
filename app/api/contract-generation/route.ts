import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// PDF Generation API endpoint - Use environment variable or construct from current host
const PDF_API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/pdf-generation`
  : '/api/pdf-generation';
// External webhook to notify when PDF is ready
const NOTIFY_WEBHOOK_URL =
  process.env.WEBHOOK_URL ||
  'https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4';

export const POST = withAnyRBAC(
  ['contract:generate:own', 'contract:create:own'],
  async (request: Request): Promise<NextResponse> => {
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

        // Authenticate user (RBAC guard already handles this, but keeping for safety)
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Call PDF generation API (internal or external based on configuration)
        // If PDF_API_URL is relative, we need to construct full URL for server-side fetch
        const apiUrl = PDF_API_URL.startsWith('http')
          ? PDF_API_URL
          : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${PDF_API_URL}`;

        const pdfRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!pdfRes.ok) {
          return NextResponse.json(
            { error: 'Failed to generate PDF' },
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

        // 2. Update contract record in Supabase
        const { contractId } = body;
        const { error: updateError } = await supabase
          .from('contracts')
          .update({ pdf_url: pdfUrl, status: 'completed', updated_by: user.id })
          .eq('id', contractId);
        if (updateError) {
          return NextResponse.json(
            {
              error: 'Failed to update contract with PDF URL',
              details: updateError.message,
            },
            { status: 500 }
          );
        }

        // 3. Notify external webhook (optional, don't fail if webhook fails)
        try {
          const notifyPayload = {
            contract_number: body.contractNumber,
            pdf_url: pdfUrl,
            status: 'ready',
          };
          await fetch(NOTIFY_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifyPayload),
          });
        } catch (webhookError) {
          // Don't fail the entire request if webhook fails
        }

        // 4. Return PDF URL
        return NextResponse.json({
          pdf_url: pdfUrl,
          processing_time: Date.now() - startTime,
        });
      })();

      // Race between processing and timeout
      const result = await Promise.race([processPromise, timeoutPromise]);
      return result as NextResponse;
    } catch (error) {
      const processingTime = Date.now() - startTime;
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
);
