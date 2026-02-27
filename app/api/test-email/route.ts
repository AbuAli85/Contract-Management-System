import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Test Email Endpoint - sends a test email.
 * PROTECTED: Admin-only endpoint.
 */
export async function GET() {
  try {
    // Admin-only: require authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not configured',
        message: 'Add RESEND_API_KEY to your environment variables',
      });
    }

    const { sendEmail } = await import('@/lib/services/email.service');
    const testEmail = process.env.TEST_EMAIL || user.email || '';

    if (!testEmail) {
      return NextResponse.json({ success: false, error: 'No test email address configured' });
    }

    const result = await sendEmail({
      to: testEmail,
      subject: `Test Email - ${new Date().toLocaleString()}`,
      html: '<p>This is a test email from the Contract Management System.</p>',
    });

    return NextResponse.json({ success: true, result, sentTo: testEmail });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
