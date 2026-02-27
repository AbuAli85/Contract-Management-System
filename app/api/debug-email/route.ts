import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Debug Email Endpoint - shows email configuration (without sending).
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

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@portal.thesmartpro.io';
    const fromName = process.env.RESEND_FROM_NAME || 'SmartPro Contract Management System';
    const apiKeySet = !!process.env.RESEND_API_KEY;
    const apiKeyPreview = process.env.RESEND_API_KEY
      ? `${process.env.RESEND_API_KEY.substring(0, 8)}...`
      : 'NOT SET';

    return NextResponse.json({
      title: 'EMAIL CONFIGURATION DEBUG',
      resendConfig: {
        fromEmail,
        fromName,
        apiKeySet,
        apiKeyPreview,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
