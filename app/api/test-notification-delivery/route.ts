import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/email.service';

/**
 * Test Notification Delivery Diagnostic Tool
 * Tests different email formats to identify delivery issues
 */
export async function POST(request: NextRequest) {
  try {
    const { email, testType = 'all' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      testEmail: email,
      tests: [],
    };

    // Test 1: Simple Plain Text Email
    if (testType === 'all' || testType === 'simple') {
      const simpleResult = await sendEmail({
        to: email,
        subject: 'Test 1: Simple Email',
        html: '<p>This is a simple test email. If you receive this, basic email delivery is working.</p>',
      });

      results.tests.push({
        name: 'Simple Email',
        success: simpleResult.success,
        messageId: simpleResult.messageId,
        error: simpleResult.error,
        description: 'Plain text format - should pass spam filters',
      });
    }

    // Test 2: Professional HTML Email (like your notifications)
    if (testType === 'all' || testType === 'professional') {
      const professionalHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
              .container { background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
              .header { background: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; }
              .button { background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
              .footer { color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 URGENT: Document Expiry Notification</h1>
              </div>
              <div class="content">
                <h2>Test Professional Email Format</h2>
                <p>This email uses the same professional format as your real notifications.</p>
                <p><strong>If you DON'T receive this email:</strong> Microsoft 365 is blocking professional HTML emails.</p>
                <a href="#" class="button">View Details</a>
                <table style="width: 100%; margin-top: 20px; border: 1px solid #ddd;">
                  <tr style="background: #f9f9f9;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: left;">Status</th>
                  </tr>
                  <tr>
                    <td style="padding: 10px;">Document Type</td>
                    <td style="padding: 10px;">ID Card</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px;">Expiry Date</td>
                    <td style="padding: 10px;">2025-11-30</td>
                  </tr>
                </table>
              </div>
              <div class="footer">
                <p>SmartPro Contract Management System | Falcon Eye Group</p>
                <p>This is an automated notification from portal.thesmartpro.io</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const professionalResult = await sendEmail({
        to: email,
        subject: '🚨 URGENT: Test Professional Email Format',
        html: professionalHtml,
      });

      results.tests.push({
        name: 'Professional HTML Email',
        success: professionalResult.success,
        messageId: professionalResult.messageId,
        error: professionalResult.error,
        description: 'Complex HTML with styling - may be blocked by spam filters',
      });
    }

    // Test 3: Simple HTML Email (middle ground)
    if (testType === 'all' || testType === 'medium') {
      const mediumHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test 3: Medium Complexity Email</h2>
          <p>Hello,</p>
          <p>This is a moderately styled email without complex tables or heavy formatting.</p>
          <p><strong>Document:</strong> ID Card<br>
          <strong>Status:</strong> Expiring Soon<br>
          <strong>Days Remaining:</strong> 30</p>
          <p>Best regards,<br>SmartPro Team</p>
        </div>
      `;

      const mediumResult = await sendEmail({
        to: email,
        subject: 'Test 3: Medium Complexity Email',
        html: mediumHtml,
      });

      results.tests.push({
        name: 'Medium Complexity Email',
        success: mediumResult.success,
        messageId: mediumResult.messageId,
        error: mediumResult.error,
        description: 'Moderate styling - good balance between appearance and deliverability',
      });
    }

    // Summary
    const allSuccessful = results.tests.every((t: any) => t.success);
    results.summary = {
      totalTests: results.tests.length,
      successful: results.tests.filter((t: any) => t.success).length,
      failed: results.tests.filter((t: any) => !t.success).length,
      allPassed: allSuccessful,
      recommendation: allSuccessful
        ? '✅ All emails sent successfully to Resend. Check your inbox, spam, and quarantine.'
        : '❌ Some emails failed to send. Check Resend API key configuration.',
    };

    // Instructions
    results.instructions = {
      step1: 'Wait 1-2 minutes for emails to arrive',
      step2: 'Check these locations in order:',
      locations: [
        '1. Inbox',
        '2. Spam/Junk folder',
        '3. Quarantine (https://security.microsoft.com/quarantine)',
        '4. Deleted Items',
        '5. All Mail / Archive',
      ],
      step3: 'Search for: from:noreply@portal.thesmartpro.io',
      step4: 'Report back which emails arrived and where',
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email Delivery Diagnostic Tool',
    usage: {
      endpoint: 'POST /api/test-notification-delivery',
      body: {
        email: 'your-email@example.com',
        testType: 'all | simple | professional | medium',
      },
      example: {
        email: 'oprations@falconeyegroup.net',
        testType: 'all',
      },
    },
    description: 'Tests different email formats to identify Microsoft 365 blocking issues',
  });
}

