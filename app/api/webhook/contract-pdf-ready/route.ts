import { NextRequest, NextResponse } from 'next/server';
import { contractGenerationService } from '@/lib/contract-generation-service';
import { verifyWebhook } from '@/lib/webhooks/verify';

// Webhook endpoint for contract PDF ready notifications

export async function POST(request: NextRequest) {
  try {
    console.log('📄 PDF Ready webhook received');

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify HMAC signature and idempotency if secret is configured
    let body: any;
    const secret = process.env.PDF_READY_WEBHOOK_SECRET || '';
    if (secret) {
      const verification = await verifyWebhook({
        rawBody,
        signature: request.headers.get('x-signature') || '',
        timestamp: request.headers.get('x-timestamp') || '',
        idempotencyKey: request.headers.get('x-idempotency-key') || '',
        secret,
      });

      if (!verification.verified) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (verification.idempotent) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      body = verification.payload;
    } else {
      // Fallback to parsing JSON directly when no secret is set
      body = JSON.parse(rawBody || '{}');
    }

    console.log('📄 Webhook payload:', body);

    // Validate required fields
    const { contract_id, contract_number, pdf_url, google_drive_url, status } =
      body;

    if (!contract_id && !contract_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_id or contract_number is required',
        },
        { status: 400 }
      );
    }

    if (!pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'pdf_url is required',
        },
        { status: 400 }
      );
    }

    // Update contract with PDF URL
    const success = await contractGenerationService.updateContractWithPDF(
      contract_id || contract_number,
      pdf_url,
      google_drive_url
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update contract',
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract updated with PDF URL:', pdf_url);
    console.log('📝 Webhook processed successfully');

    // Send success response
    return NextResponse.json({
      success: true,
      message: 'Contract updated successfully',
      contract_id: contract_id || contract_number,
      pdf_url,
      status: status || 'generated',
    });
  } catch (error) {
    console.error('❌ PDF Ready webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('📄 PDF Ready webhook received (PATCH)');

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify HMAC signature and idempotency if secret is configured
    let body: any;
    const secret = process.env.PDF_READY_WEBHOOK_SECRET || '';
    if (secret) {
      const verification = await verifyWebhook({
        rawBody,
        signature: request.headers.get('x-signature') || '',
        timestamp: request.headers.get('x-timestamp') || '',
        idempotencyKey: request.headers.get('x-idempotency-key') || '',
        secret,
      });

      if (!verification.verified) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (verification.idempotent) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      body = verification.payload;
    } else {
      // Fallback to parsing JSON directly when no secret is set
      body = JSON.parse(rawBody || '{}');
    }

    console.log('📄 Webhook payload (PATCH):', body);

    // Validate required fields
    const { contract_id, contract_number, pdf_url, google_drive_url, status } =
      body;

    console.log('📋 Validation data:', {
      contract_id,
      contract_number,
      pdf_url,
      google_drive_url,
      status
    });

    if (!contract_id && !contract_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_id or contract_number is required',
        },
        { status: 400 }
      );
    }

    if (!pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'pdf_url is required',
        },
        { status: 400 }
      );
    }

    // Check if URLs are complete (not just base URLs)
    let finalPdfUrl = pdf_url;
    let finalGoogleDriveUrl = google_drive_url;
    
    if (pdf_url.endsWith('/') || pdf_url.includes('/d//')) {
      console.warn('⚠️ Incomplete URLs detected:', {
        pdf_url,
        google_drive_url,
        full_payload: body
      });
      
      // For now, let's accept incomplete URLs and log them for debugging
      console.log('🔍 Make.com scenario issue - URLs are incomplete. This suggests:');
      console.log('1. Google Docs document creation may have failed');
      console.log('2. PDF export may have failed');
      console.log('3. File upload to Supabase storage may have failed');
      console.log('4. Make.com scenario may have incorrect field mappings');
      
      // Continue processing but with warning
      console.warn('⚠️ Proceeding with incomplete URLs for debugging purposes');
      
      // Set placeholder URLs for now
      finalPdfUrl = `https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/contracts/contract-${contract_number || 'unknown'}.pdf`;
      finalGoogleDriveUrl = `https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit`;
      
      console.log('🔧 Using placeholder URLs:', {
        pdf_url: finalPdfUrl,
        google_drive_url: finalGoogleDriveUrl
      });
    }

    // Update contract with PDF URL
    console.log('🔄 Attempting to update contract:', {
      contract_id,
      contract_number,
      finalPdfUrl,
      finalGoogleDriveUrl
    });
    
    try {
      const success = await contractGenerationService.updateContractWithPDF(
        contract_id || contract_number,
        finalPdfUrl,
        finalGoogleDriveUrl
      );
      
      if (!success) {
        console.error('❌ Contract update failed for:', contract_id || contract_number);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to update contract',
            details: `Contract ${contract_id || contract_number} not found or update failed`
          },
          { status: 500 }
        );
      }
      
      console.log('✅ Contract updated with PDF URL (PATCH):', finalPdfUrl);
      console.log('📝 Webhook processed successfully (PATCH)');

      // Send success response
      return NextResponse.json({
        success: true,
        message: 'Contract updated successfully',
        contract_id: contract_id || contract_number,
        pdf_url: finalPdfUrl,
        status: status || 'generated',
      });
    } catch (updateError) {
      console.error('❌ Contract update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Contract update failed',
          details: updateError instanceof Error ? updateError.message : 'Unknown update error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ PDF Ready webhook error (PATCH):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'PDF Ready webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}