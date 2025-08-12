import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContractPDF } from '@/lib/pdf-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
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

    // Fetch contract with all related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        first_party:parties!first_party_id(*),
        second_party:parties!second_party_id(*),
        promoter:promoters(*)
      `
      )
      .eq('id', contractId)
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

    // Generate PDF content using the new PDF generator
    const pdfBuffer = await generateContractPDF(contract);

    // Create a proper PDF file name
    const fileName = `contract-${contract.contract_number || contractId}-${Date.now()}.pdf`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);

      // Check if it's a bucket not found error
      if (
        uploadError.message?.includes('Bucket not found') ||
        uploadError.message?.includes('404')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Storage bucket "contracts" not found',
            details:
              'Please run the storage setup script or create the bucket manually in Supabase Dashboard',
            solution: 'Run: npm run setup-storage',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload PDF',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('contracts').getPublicUrl(fileName);

    // Update contract with new PDF URL
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        pdf_url: publicUrl,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update contract',
        },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase.from('user_activity_log').insert({
      user_id: session.user.id,
      action: 'pdf_generated',
      resource_type: 'contract',
      resource_id: contractId,
      details: {
        contract_number: contract.contract_number,
        pdf_url: publicUrl,
        file_name: fileName,
      },
    });

    return NextResponse.json({
      success: true,
      pdf_url: publicUrl,
      message: 'PDF generated successfully',
    });
  } catch (error) {
    console.error('Generate PDF API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
