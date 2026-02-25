import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this diagnostic route
export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to test database connectivity and RBAC configuration
 * This helps identify issues with the parties API
 */
export async function GET(request: Request) {
  const diagnosticResults: any = {
    timestamp: new Date().toISOString(),
    checks: [],
    environment: process.env.NODE_ENV,
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  // Helper function to add check result
  const addCheck = (
    name: string,
    status: 'pass' | 'fail' | 'warning',
    message: string,
    details?: any
  ) => {
    diagnosticResults.checks.push({ name, status, message, details });
    diagnosticResults.summary[
      status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'warnings'
    ]++;
  };

  try {
    // Check 1: Environment Variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      RBAC_ENFORCEMENT: process.env.RBAC_ENFORCEMENT || 'not set',
    };

    if (
      envVars.NEXT_PUBLIC_SUPABASE_URL &&
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      addCheck(
        'Environment Variables',
        'pass',
        'All required environment variables are present',
        envVars
      );
    } else {
      addCheck(
        'Environment Variables',
        'fail',
        'Missing required environment variables',
        envVars
      );
      // Return early if env vars are missing
      return NextResponse.json(diagnosticResults);
    }

    // Check 2: Supabase Client Creation
    let supabase;
    try {
      const cookieStore = await cookies();
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              try {
                cookieStore.set(name, value, options);
              } catch {}
            },
            remove(name: string, options: any) {
              try {
                cookieStore.set(name, '', options);
              } catch {}
            },
          },
        }
      );
      addCheck(
        'Supabase Client',
        'pass',
        'Supabase client created successfully'
      );
    } catch (error) {
      addCheck('Supabase Client', 'fail', 'Failed to create Supabase client', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(diagnosticResults);
    }

    // Check 3: Authentication
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        addCheck(
          'Authentication',
          'warning',
          'Authentication error (this is expected if not logged in)',
          { error: authError.message }
        );
      } else if (!user) {
        addCheck(
          'Authentication',
          'warning',
          'No authenticated user (please log in to test full functionality)',
          { userId: null }
        );
      } else {
        addCheck('Authentication', 'pass', 'User is authenticated', {
          userId: user.id,
          email: user.email,
        });
      }
    } catch (error) {
      addCheck('Authentication', 'fail', 'Authentication check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Check 4: Database Connection - Test parties table
    try {
      const { data, error, count } = await supabase
        .from('parties')
        .select('*', { count: 'exact', head: true });

      if (error) {
        addCheck(
          'Database Connection',
          'fail',
          'Failed to query parties table',
          {
            error: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details,
          }
        );
      } else {
        addCheck(
          'Database Connection',
          'pass',
          'Successfully connected to parties table',
          {
            tableExists: true,
            rowCount: count,
          }
        );
      }
    } catch (error) {
      addCheck(
        'Database Connection',
        'fail',
        'Database query threw an exception',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }

    // Check 5: RBAC Configuration
    try {
      const rbacMode = process.env.RBAC_ENFORCEMENT || 'enforce';
      const isEnforced = rbacMode === 'enforce';

      if (isEnforced) {
        addCheck(
          'RBAC Configuration',
          'warning',
          'RBAC is in enforce mode - users need proper permissions to access parties',
          { mode: rbacMode, enforced: true }
        );
      } else {
        addCheck(
          'RBAC Configuration',
          'pass',
          `RBAC is in ${rbacMode} mode - access restrictions may be relaxed`,
          { mode: rbacMode, enforced: false }
        );
      }
    } catch (error) {
      addCheck(
        'RBAC Configuration',
        'warning',
        'Could not determine RBAC configuration',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }

    // Check 6: Sample Query
    try {
      const { data: parties, error } = await supabase
        .from('parties')
        .select('id, name_en, type')
        .limit(1);

      if (error) {
        addCheck(
          'Sample Query',
          'fail',
          'Failed to fetch sample parties data',
          {
            error: error.message,
            code: error.code,
          }
        );
      } else if (!parties || parties.length === 0) {
        addCheck(
          'Sample Query',
          'warning',
          'No parties found in database (table might be empty)',
          { partyCount: 0 }
        );
      } else {
        addCheck(
          'Sample Query',
          'pass',
          'Successfully fetched sample parties data',
          {
            sampleParty: parties[0],
            querySuccess: true,
          }
        );
      }
    } catch (error) {
      addCheck('Sample Query', 'fail', 'Sample query threw an exception', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Overall status
    diagnosticResults.overallStatus =
      diagnosticResults.summary.failed > 0
        ? 'FAILED'
        : diagnosticResults.summary.warnings > 0
          ? 'WARNING'
          : 'PASSED';

    // Recommendations
    diagnosticResults.recommendations = [];

    if (diagnosticResults.summary.failed > 0) {
      diagnosticResults.recommendations.push(
        'Fix the failed checks before proceeding'
      );
    }

    if (
      !diagnosticResults.checks.find((c: any) => c.name === 'Authentication')
        ?.details?.userId
    ) {
      diagnosticResults.recommendations.push(
        'Log in to test full API functionality'
      );
    }

    if (process.env.RBAC_ENFORCEMENT === 'enforce') {
      diagnosticResults.recommendations.push(
        'Ensure users have the "party:read:own" permission to access parties API'
      );
      diagnosticResults.recommendations.push(
        'To temporarily bypass RBAC for debugging, set RBAC_ENFORCEMENT=dry-run in .env.local'
      );
    }


    return NextResponse.json(diagnosticResults, { status: 200 });
  } catch (error) {

    diagnosticResults.overallStatus = 'EXCEPTION';
    diagnosticResults.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    return NextResponse.json(diagnosticResults, { status: 500 });
  }
}
