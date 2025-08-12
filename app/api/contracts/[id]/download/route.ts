import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please log in',
        },
        { status: 401 }
      );
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }

    // Check if contract has PDF
    if (!contract.pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract PDF not available',
        },
        { status: 404 }
      );
    }

    // Get file from Supabase storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('contracts')
      .download(contract.pdf_url.split('/contracts/')[1] || contract.pdf_url);

    if (fileError || !fileData) {
      console.error('Error downloading file:', fileError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to download contract PDF',
        },
        { status: 500 }
      );
    }

    // Convert to blob
    const blob = new Blob([fileData], { type: 'application/pdf' });

    // Create response with proper headers
    const response = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${contract.contract_number || id}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

    return response;
  } catch (error) {
    console.error('Contract download API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
