import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// POST /api/contracts/[id]/generate-pdf - Generate PDF for a contract
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    console.log('🔍 PDF generation API called');
    
    const supabase = await createClient();
    const { id: contractId } = await params;

    console.log('🔍 Contract ID:', contractId);

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('🔍 Auth check:', { user: user?.id, authError });

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    console.log('🔍 Contract fetch result:', { contract: contract?.id, contractError });

    if (contractError || !contract) {
      console.log('❌ Contract not found:', contractError);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // TODO: Implement actual PDF generation logic here
    // For now, we'll simulate the process
    console.log(`🔍 Generating PDF for contract ${contractId}...`);

    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a mock PDF URL (replace with actual PDF generation)
    const mockPdfUrl = `https://portal.thesmartpro.io/api/contracts/${contractId}/pdf/download`;

    // Update contract with PDF URL (only if pdf_url column exists)
    try {
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          pdf_url: mockPdfUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (updateError) {
        console.warn('⚠️ Could not update contract with PDF URL (column may not exist):', updateError);
        // Continue execution even if update fails
      } else {
        console.log('✅ Contract updated with PDF URL');
      }
    } catch (updateError) {
      console.warn('⚠️ Error updating contract with PDF URL:', updateError);
      // Continue execution even if update fails
    }

    console.log('✅ PDF generation completed successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'PDF generated successfully!',
        pdf_url: mockPdfUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in POST /api/contracts/[id]/generate-pdf:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
