import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Check if RBAC bypass is enabled for debugging
const RBAC_BYPASS =
  process.env.RBAC_BYPASS === 'true' ||
  process.env.RBAC_ENFORCEMENT === 'disabled';

// Validation schema for party data
const partySchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_ar: z.string().min(1, 'Arabic name is required'),
  crn: z.string().min(1, 'CRN is required'),
  type: z.enum(['Employer', 'Client', 'Generic']).default('Generic'),
  role: z.string().optional(),
  cr_expiry: z.string().optional(), // Changed from cr_expiry_date
  cr_expiry_date: z.string().optional(), // Keep for backward compatibility
  cr_status: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address_en: z.string().optional(),
  address_ar: z.string().optional(),
  tax_number: z.string().optional(),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  license_expiry_date: z.string().optional(), // Keep for backward compatibility
  license_status: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
  overall_status: z.string().optional(),
  notes: z.string().optional(),
});

// Main GET handler
async function handleGET(request: Request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL environment variable is not set'
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set'
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
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
            } catch {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', options);
            } catch {
              // The `remove` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get authenticated user with timeout and retry logic
    const authStartTime = Date.now();
    let authAttempts = 0;
    const maxAuthAttempts = 3;
    let user: any = null;
    let authError: any = null;

    while (authAttempts < maxAuthAttempts && !user && !authError) {
      authAttempts++;
      try {
        const authResult = await supabase.auth.getUser();
        user = authResult.data.user;
        authError = authResult.error;

        if (authError) {

          // Wait before retry (exponential backoff)
          if (authAttempts < maxAuthAttempts) {
            await new Promise(resolve =>
              setTimeout(resolve, 1000 * authAttempts)
            );
          }
        }
      } catch (error) {
        authError = error;

        if (authAttempts < maxAuthAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * authAttempts)
          );
        }
      }
    }

    const authDuration = Date.now() - authStartTime;

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          message: authError.message,
          details:
            process.env.NODE_ENV === 'development'
              ? {
                  attempts: authAttempts,
                  duration: `${authDuration}ms`,
                }
              : undefined,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource',
          details:
            process.env.NODE_ENV === 'development'
              ? {
                  attempts: authAttempts,
                  duration: `${authDuration}ms`,
                }
              : undefined,
        },
        { status: 401 }
      );
    }

    // Parse pagination and filters from query params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    // Allow higher limits for specific use cases (e.g., fetching all employers)
    // Default max is 100, but allow up to 1000 if explicitly requested
    const requestedLimit = parseInt(url.searchParams.get('limit') || '20');
    const limit =
      requestedLimit > 100
        ? Math.min(requestedLimit, 1000) // Allow up to 1000 for bulk operations
        : Math.min(Math.max(1, requestedLimit), 100); // Default max 100
    const offset = (page - 1) * limit;
    const typeFilter = url.searchParams.get('type'); // Get type filter


    // Fetch parties from the database with pagination and retry logic
    const queryStartTime = Date.now();
    let queryAttempts = 0;
    const maxQueryAttempts = 3;
    let parties: any[] | null = null;
    let count: number | null = null;
    let queryError: any = null;

    while (queryAttempts < maxQueryAttempts && !parties && !queryError) {
      queryAttempts++;
      try {

        let query = supabase.from('parties').select('*', { count: 'exact' });

        // Apply type filter if provided
        if (typeFilter) {
          query = query.eq('type', typeFilter);
        }

        const queryResult = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        parties = queryResult.data;
        count = queryResult.count;
        queryError = queryResult.error;

        if (queryError) {

          // Wait before retry (exponential backoff)
          if (queryAttempts < maxQueryAttempts) {
            await new Promise(resolve =>
              setTimeout(resolve, 1000 * queryAttempts)
            );
          }
        }
      } catch (error) {
        queryError = error;

        if (queryAttempts < maxQueryAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * queryAttempts)
          );
        }
      }
    }

    const queryDuration = Date.now() - queryStartTime;

    if (queryError) {

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch parties',
          message: 'A database error occurred while fetching parties',
          details:
            process.env.NODE_ENV === 'development'
              ? {
                  message: queryError.message,
                  code: queryError.code,
                  hint: queryError.hint,
                  attempts: queryAttempts,
                  duration: `${queryDuration}ms`,
                }
              : undefined,
        },
        { status: 500 }
      );
    }

    // Validate and check results
    if (!parties) {
      parties = [];
    }

    if (!Array.isArray(parties)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data format',
          message: 'The server returned invalid data format',
          details:
            process.env.NODE_ENV === 'development'
              ? {
                  dataType: typeof parties,
                  isArray: Array.isArray(parties),
                }
              : undefined,
        },
        { status: 500 }
      );
    }

    if (parties.length === 0) {
    } else {
    }

    const totalDuration = Date.now() - startTime;

    // Fetch contract counts for all parties
    const contractCountsStartTime = Date.now();
    const contractCounts: Record<string, { total: number; active: number }> =
      {};

    try {

      // Get party IDs from the current batch
      const partyIds = parties.map(p => p.id);

      // Query contracts to count by party
      // Check all possible foreign key columns: employer_id, client_id, first_party_id, second_party_id
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(
          'employer_id, client_id, first_party_id, second_party_id, status'
        );

      if (contractError) {
      } else if (contractData) {
        // Count contracts for each party
        contractData.forEach((contract: any) => {
          // Check all possible foreign key columns
          // Convert all IDs to strings for consistent comparison (handles TEXT vs UUID)
          const partyIdFields = [
            contract.employer_id,
            contract.client_id,
            contract.first_party_id,
            contract.second_party_id,
          ]
            .filter(id => id != null) // Filter out null/undefined
            .map(id => String(id)) // Convert to string for safe comparison
            .filter(id => partyIds.includes(id)); // Check if in current batch

          // Count unique party involvements
          const uniquePartyIds = [...new Set(partyIdFields)];

          uniquePartyIds.forEach(partyId => {
            if (!contractCounts[partyId]) {
              contractCounts[partyId] = { total: 0, active: 0 };
            }
            contractCounts[partyId].total += 1;

            // Count active contracts (active, pending, or approved status)
            if (
              contract.status &&
              ['active', 'pending', 'approved'].includes(
                contract.status.toLowerCase()
              )
            ) {
              contractCounts[partyId].active += 1;
            }
          });
        });

      }
    } catch (error) {
      // Continue with empty counts
    }

    const contractCountsDuration = Date.now() - contractCountsStartTime;

    // Transform data to include contract counts with validation
    const partiesWithCounts = parties.map(party => {
      try {
        // Validate required fields
        if (!party.id) {
        }
        if (!party.name_en && !party.name_ar) {
        }

        // Get contract counts for this party
        const counts = contractCounts[party.id] || { total: 0, active: 0 };

        return {
          ...party,
          total_contracts: counts.total,
          active_contracts: counts.active,
        };
      } catch (error) {

        // Return a safe fallback
        return {
          id: party.id || 'unknown',
          name_en: party.name_en || 'Unknown Party',
          name_ar: party.name_ar || '',
          type: party.type || 'Generic',
          status: party.status || 'Active',
          total_contracts: 0,
          active_contracts: 0,
          ...party,
        };
      }
    });

    const response = {
      success: true,
      parties: partiesWithCounts,
      count: parties.length,
      total: count || 0,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
      _meta:
        process.env.NODE_ENV === 'development'
          ? {
              requestId,
              duration: `${totalDuration}ms`,
              authAttempts,
              queryAttempts,
              breakdown: {
                auth: `${authDuration}ms`,
                query: `${queryDuration}ms`,
                contractCounts: `${contractCountsDuration}ms`,
              },
            }
          : undefined,
    };


    return NextResponse.json(response);
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    // Enhanced error logging with more context
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.constructor.name : typeof error,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      requestId,
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
    };


    // Log to external service if configured (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorDetails });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                message:
                  error instanceof Error ? error.message : 'Unknown error',
                type:
                  error instanceof Error
                    ? error.constructor.name
                    : typeof error,
                stack: error instanceof Error ? error.stack : undefined,
              }
            : undefined,
        _meta:
          process.env.NODE_ENV === 'development'
            ? {
                requestId,
                duration: `${totalDuration}ms`,
                timestamp: new Date().toISOString(),
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Export GET with optional RBAC protection
export const GET = RBAC_BYPASS
  ? async (request: Request) => {
      return handleGET(request);
    }
  : withRBAC('party:read:own', handleGET);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // Use regular client for auth check
    const supabase = createServerClient(
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
            } catch {
              // Ignore
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', options);
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = partySchema.parse(body);

    // Add owner_id field
    const partyData = {
      ...validatedData,
      owner_id: user.id,
    };

    // Use admin client to bypass RLS for insert
    const { createAdminClient } = await import('@/lib/supabase/server');
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (adminError) {
      // Fall back to regular client
      adminClient = supabase;
    }

    // Insert party into database with timeout
    const insertPromise = adminClient
      .from('parties')
      .insert([partyData])
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), 10000);
    });

    const { data: party, error } = (await Promise.race([
      insertPromise,
      timeoutPromise,
    ])) as any;

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to create party',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      party,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
