import { NextRequest, NextResponse } from 'next/server';
import { getEmailStatus } from '@/lib/services/email.service';

/**
 * Get Email Status API
 *
 * Check the status of a sent email by message ID
 * GET /api/email-status/[messageId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const messageId = params.messageId;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking email status for:', messageId);

    const result = await getEmailStatus(messageId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          messageId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId,
      status: result.status,
      details: result.details,
      interpretation: interpretStatus(result.status),
    });
  } catch (error) {
    console.error('❌ Error checking email status:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to interpret email status
 */
function interpretStatus(status?: string): string {
  switch (status) {
    case 'delivered':
      return "✅ Email was delivered to the recipient's mail server";
    case 'sent':
      return '📤 Email was sent but delivery not yet confirmed';
    case 'bounced':
      return '❌ Email bounced - recipient address invalid or mailbox full';
    case 'complained':
      return '⚠️ Recipient marked email as spam';
    case 'opened':
      return '👁️ Recipient opened the email';
    case 'clicked':
      return '🖱️ Recipient clicked a link in the email';
    case 'failed':
      return '❌ Email failed to send';
    default:
      return '❓ Status unknown';
  }
}
