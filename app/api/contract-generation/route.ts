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
  async (request: Request) => {
    try {
      // Parse request body
      const body = await request.json();

      // Authenticate user
      const supabase = await createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const user = session.user;

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
        // @ts-expect-error - pdf_url column exists but types not yet regenerated after migration
        .update({ pdf_url: pdfUrl, status: 'completed' })
        .eq('id', contractId);
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update contract with PDF URL' },
          { status: 500 }
        );
      }

      // 3. Notify external webhook
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

      // 4. Return PDF URL
      return NextResponse.json({ pdf_url: pdfUrl });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', details: (error as Error).message },
        { status: 500 }
      );
    }
  }
);
