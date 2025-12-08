import { NextResponse } from 'next/server';

/**
 * Test Email Endpoint
 *
 * Use this to test if Resend is working
 * Access: GET /api/test-email
 */
export async function GET() {
  try {
    console.log('🧪 Testing email configuration...');

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not configured',
        message: 'Add RESEND_API_KEY to your environment variables',
      });
    }

    console.log('✅ RESEND_API_KEY found');

    // Try to send a test email
    const { sendEmail } = await import('@/lib/services/email.service');

    const testEmail = process.env.TEST_EMAIL || 'chairman@falconeyegroup.net';

    console.log(`📧 Sending test email to: ${testEmail}`);

    const result = await sendEmail({
      to: testEmail,
      subject: `🧪 Test Email - ${new Date().toLocaleString()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">✅ Email System Working!</h2>
          <p>This is a test email from your Contract Management System.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> ${process.env.RESEND_FROM_EMAIL || 'noreply@portal.thesmartpro.io'}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, your email system is configured correctly!
          </p>
        </body>
        </html>
      `,
    });

    console.log('📊 Email send result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message:
          'Test email sent successfully! Check your inbox (and spam folder).',
        details: {
          messageId: result.messageId,
          to: testEmail,
          from:
            process.env.RESEND_FROM_EMAIL || 'noreply@portal.thesmartpro.io',
          timestamp: new Date().toISOString(),
        },
        instructions: [
          '1. Check your email inbox',
          '2. Check spam/junk folder',
          '3. Check Resend dashboard: https://resend.com/emails',
          `4. Search for message ID: ${result.messageId}`,
        ],
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
          message: 'Email sending failed',
          troubleshooting: [
            'Check if domain is verified: https://resend.com/domains',
            'Check if API key is valid: https://resend.com/api-keys',
            'Check DNS records (SPF, DKIM)',
            'Check Resend account status',
          ],
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Test email error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send test email',
        stack:
          process.env.NODE_ENV === 'development'
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 }
    );
  }
}
