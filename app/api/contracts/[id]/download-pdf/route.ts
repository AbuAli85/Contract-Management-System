import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookService } from '@/lib/webhook-service';

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json();
    const supabase = await createClient();

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if contract is approved/active
    if (contract.approval_status !== 'active') {
      return NextResponse.json(
        {
          error: 'Contract must be approved before PDF can be generated',
        },
        { status: 400 }
      );
    }

    // Trigger PDF generation and email sending
    try {
      await WebhookService.processContract(contract);

      // Log notification for follow-up
      await supabase.from('notifications').insert({
        user_id: session.user.id,
        type: 'contract_pdf_processing',
        title: 'PDF Generation Started',
        message: `PDF generation and email sending for contract ${contract.contract_number} has been initiated.`,
        data: { contract_id: contractId },
      });

      return NextResponse.json({
        success: true,
        message: 'PDF generation and email sending initiated',
        contract_number: contract.contract_number,
      });
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);

      // Log error notification
      await supabase.from('notifications').insert({
        user_id: session.user.id,
        type: 'contract_pdf_error',
        title: 'PDF Generation Error',
        message: `Failed to generate PDF for contract ${contract.contract_number}.`,
        data: {
          contract_id: contractId,
          error:
            webhookError instanceof Error
              ? webhookError.message
              : String(webhookError),
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to generate PDF',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Download PDF API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch contract and its PDF/email status
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Get recent notifications for this contract
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .contains('data', { contract_id: contractId })
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        status: contract.status,
        approval_status: contract.approval_status,
        pdf_url: contract.pdf_url,
        created_at: contract.created_at,
      },
      notifications: notifications || [],
      can_download: contract.approval_status === 'active',
      has_pdf: !!contract.pdf_url,
    });
  } catch (error) {
    console.error('Get PDF status API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
