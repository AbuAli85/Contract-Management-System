import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to verify SUPABASE_SERVICE_ROLE_KEY configuration.
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const urlProjectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

    let keyProjectRef: string | null = null;
    let jwtDecodeError: string | null = null;

    if (supabaseServiceKey) {
      try {
        const jwtParts = supabaseServiceKey.split('.');
        if (jwtParts.length === 3) {
          let base64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
          keyProjectRef = payload.ref || null;
        }
      } catch (e: any) {
        jwtDecodeError = e.message;
      }
    }

    const isProjectMismatch = keyProjectRef && urlProjectRef && keyProjectRef !== urlProjectRef;

    let adminClientTest: { success: boolean; error?: string; canRead?: boolean } = { success: false };
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const adminClient = createAdminClient();
        const { data, error } = await adminClient.from('profiles').select('id').limit(1);
        adminClientTest = { success: !error, canRead: !error, error: error?.message };
      } catch (e: any) {
        adminClientTest = { success: false, error: e.message };
      }
    }

    return NextResponse.json({
      success: !isProjectMismatch && adminClientTest.success,
      urlProjectRef,
      keyProjectRef,
      isProjectMismatch: !!isProjectMismatch,
      jwtDecodeError,
      adminClientTest,
      hasServiceKey: !!supabaseServiceKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
