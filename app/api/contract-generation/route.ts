import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PDF Generation API endpoint
const PDF_API_URL = 'https://portal.thesmartpro.io/api/pdf-generation';
// External webhook to notify when PDF is ready
const NOTIFY_WEBHOOK_URL = 'https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Authenticate user
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    // 1. Call external PDF generation API
    const pdfRes = await fetch(PDF_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
    const pdfResult = await pdfRes.json();
    const pdfUrl = pdfResult.pdf_url;
    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL missing from generation response' }, { status: 500 });
    }

    // 2. Update contract record in Supabase
    const { contractId } = body;
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ pdf_url: pdfUrl, status: 'completed' })
      .eq('id', contractId);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update contract with PDF URL' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
} 