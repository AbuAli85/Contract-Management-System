import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateContractPDF } from '@/lib/pdf-generator';

/**
 * Native PDF Generation Endpoint
 * Uses jsPDF to generate contract PDFs without external dependencies
 *
 * POST /api/pdf/generate-contract
 * Body: { contractId: string }
 *
 * Returns: PDF file or uploads to Supabase Storage
 */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { contractId, returnType = 'url' } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    console.log('📄 Generating PDF for contract:', contractId);

    // 3. Fetch contract data with all relations
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        promoter:promoter_id (
          name_en,
          name_ar,
          mobile_number,
          email,
          id_card_number
        ),
        first_party:first_party_id (
          name_en,
          name_ar,
          crn,
          address_en,
          contact_person,
          contact_email,
          contact_phone
        ),
        second_party:second_party_id (
          name_en,
          name_ar,
          contact_person,
          contact_email,
          contact_phone
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      console.error('❌ Contract fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Contract not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    // 4. Verify user has access to this contract
    const isOwner = contract.created_by === user.id;
    const isAssignedPromoter =
      contract.promoter_id && contract.promoter?.email === user.email;

    if (!isOwner && !isAssignedPromoter) {
      // Check if user has admin/manager role
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const hasAdminAccess =
        userRole?.role === 'admin' || userRole?.role === 'manager';

      if (!hasAdminAccess) {
        return NextResponse.json(
          { error: 'You do not have permission to generate this contract PDF' },
          { status: 403 }
        );
      }
    }

    // 5. Generate PDF using jsPDF
    console.log('🔧 Generating PDF with jsPDF...');
    const pdfBuffer = await generateContractPDF(contract);
    console.log(
      '✅ PDF generated successfully, size:',
      pdfBuffer.length,
      'bytes'
    );

    // 6. Handle return type
    if (returnType === 'download') {
      // Return PDF directly for download
      // Convert Buffer to Uint8Array for NextResponse
      const pdfArrayBuffer = new Uint8Array(pdfBuffer);

      return new NextResponse(pdfArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="contract-${contract.contract_number}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    }

    // 7. Upload to Supabase Storage and return URL
    const fileName = `contracts/${contract.id}/contract-${contract.contract_number}-${Date.now()}.pdf`;

    console.log('📤 Uploading PDF to Supabase Storage:', fileName);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contract-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF', details: uploadError.message },
        { status: 500 }
      );
    }

    // 8. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('contract-documents').getPublicUrl(fileName);

    console.log('✅ PDF uploaded successfully:', publicUrl);

    // 9. Update contract record with PDF URL
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        pdf_url: publicUrl,
        pdf_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('⚠️ Failed to update contract record:', updateError);
      // Don't fail the request, PDF was still generated
    }

    // 10. Send email notification (if requested)
    if (body.sendEmail && contract.promoter?.email) {
      try {
        const { sendEmail } = await import('@/lib/services/email.service');
        const { standardNotificationEmail } = await import(
          '@/lib/email-templates'
        );

        const emailContent = standardNotificationEmail({
          title: 'Contract PDF Ready',
          promoterName: contract.promoter.name_en || 'User',
          message: `Your contract PDF (${contract.contract_number}) has been generated and is ready for download.`,
          actionUrl: publicUrl,
          actionText: 'Download PDF',
        });

        await sendEmail({
          to: contract.promoter.email,
          ...emailContent,
        });

        console.log('✅ Email notification sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send email notification:', emailError);
        // Don't fail the request, PDF was still generated
      }
    }

    // 11. Return success response
    return NextResponse.json({
      success: true,
      pdf_url: publicUrl,
      contract_number: contract.contract_number,
      generated_at: new Date().toISOString(),
      file_size: pdfBuffer.length,
      message: 'PDF generated successfully using native jsPDF',
    });
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
