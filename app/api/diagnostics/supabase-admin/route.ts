import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to verify SUPABASE_SERVICE_ROLE_KEY configuration
 * This helps identify if the key is for the wrong project or invalid
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Extract project reference from URL
    const urlProjectRef = supabaseUrl?.match(
      /https?:\/\/([^.]+)\.supabase\.co/
    )?.[1];

    // Try to decode JWT to get project reference from key
    let keyProjectRef: string | null = null;
    let jwtDecodeError: string | null = null;

    if (supabaseServiceKey) {
      try {
        const jwtParts = supabaseServiceKey.split('.');
        if (jwtParts.length === 3) {
          // JWT uses base64url encoding, need to convert to base64
          let base64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
          // Add padding if needed
          while (base64.length % 4) {
            base64 += '=';
          }
          // Decode the payload (second part of JWT)
          const payload = JSON.parse(
            Buffer.from(base64, 'base64').toString('utf-8')
          );
          keyProjectRef = payload.ref || null;
        } else {
          jwtDecodeError = 'JWT does not have 3 parts';
        }
      } catch (e: any) {
        jwtDecodeError = e.message || 'Failed to decode JWT';
      }
    }

    const isProjectMismatch =
      keyProjectRef && urlProjectRef && keyProjectRef !== urlProjectRef;

    // Test the admin client
    let adminClientTest: {
      success: boolean;
      error?: string;
      errorCode?: string;
      canRead?: boolean;
    } = { success: false };

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const adminClient = createAdminClient();

        // Test read access
        const { error: testError, data: testData } = await adminClient
          .from('company_members')
          .select('id')
          .limit(1);

        if (testError) {
          adminClientTest = {
            success: false,
            error: testError.message,
            errorCode: testError.code,
            canRead: false,
          };
        } else {
          adminClientTest = {
            success: true,
            canRead: true,
          };
        }
      } catch (e: any) {
        adminClientTest = {
          success: false,
          error: e.message || 'Failed to create admin client',
          canRead: false,
        };
      }
    }

    return NextResponse.json({
      configuration: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        supabaseUrl,
        urlProjectRef,
        serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) || 'NOT_SET',
        serviceKeyLength: supabaseServiceKey?.length || 0,
      },
      projectVerification: {
        urlProjectRef,
        keyProjectRef,
        isProjectMismatch,
        jwtDecodeError,
      },
      adminClientTest,
      recommendations: isProjectMismatch
        ? [
            `⚠️ PROJECT MISMATCH: Your service role key is for project "${keyProjectRef}" but your URL is for project "${urlProjectRef}"`,
            `1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/${urlProjectRef}`,
            '2. Navigate to Settings → API',
            '3. Copy the service_role key (not the anon key)',
            '4. Update SUPABASE_SERVICE_ROLE_KEY in Vercel',
            '5. Redeploy your application',
          ]
        : adminClientTest.success
          ? ['✅ Service role key is working correctly']
          : [
              '❌ Service role key test failed',
              '1. Verify the key is correct in Supabase Dashboard',
              '2. Ensure the key is for the correct project',
              '3. Check that RLS policies allow service role access',
              '4. Redeploy after updating the key',
            ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Diagnostic check failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
