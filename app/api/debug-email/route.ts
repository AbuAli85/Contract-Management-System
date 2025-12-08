import { NextResponse } from 'next/server';

/**
 * Debug Email Endpoint
 * Shows EXACTLY what email will be sent (without actually sending)
 */
export async function GET() {
  try {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'noreply@portal.thesmartpro.io';
    const fromName =
      process.env.RESEND_FROM_NAME || 'SmartPro Contract Management System';
    const apiKeySet = !!process.env.RESEND_API_KEY;
    const apiKeyPreview = process.env.RESEND_API_KEY
      ? process.env.RESEND_API_KEY.substring(0, 10) + '...'
      : 'NOT SET';

    // Get test promoter email
    const { getSupabaseAdmin } = await import('@/lib/supabase/admin');
    const supabase = getSupabaseAdmin();

    const { data: promoter } = await supabase
      .from('promoters')
      .select('id, name_en, email')
      .eq('id', '9cd6bf5c-2998-4302-a1ca-92d1c35ebab3')
      .single();

    return NextResponse.json({
      title: 'EMAIL CONFIGURATION DEBUG',
      resendConfig: {
        apiKeySet,
        apiKeyPreview,
        fromEmail,
        fromName,
        fromFormatted: `${fromName} <${fromEmail}>`,
      },
      testRecipient: {
        promoterId: promoter?.id,
        promoterName: promoter?.name_en,
        email: promoter?.email,
        explanation:
          'This is the email address that will receive notifications',
      },
      expectedBehavior: {
        testEmail: {
          endpoint: '/api/test-email',
          to: process.env.TEST_EMAIL || 'chairman@falconeyegroup.net',
          from: `${fromName} <${fromEmail}>`,
        },
        realNotification: {
          endpoint: '/api/promoters/[id]/notify',
          to: promoter?.email,
          from: `${fromName} <${fromEmail}>`,
        },
      },
      verification: {
        step1: 'Verify the email addresses above are correct',
        step2: 'Check if recipient email exists and is accessible',
        step3: 'Check if there are email forwarding rules',
        step4: 'Check organization-level quarantine',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
