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
    console.log(`[${requestId}] 🚀 Parties API Request started`);

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
          console.warn(
            `[${requestId}] ⚠️ Auth attempt ${authAttempts} failed:`,
            {
              message: authError.message,
              status: authError.status,
            }
          );

          // Wait before retry (exponential backoff)
          if (authAttempts < maxAuthAttempts) {
            await new Promise(resolve =>
              setTimeout(resolve, 1000 * authAttempts)
            );
          }
        }
      } catch (error) {
        console.error(
          `[${requestId}] 💥 Auth attempt ${authAttempts} threw error:`,
          error
        );
        authError = error;

        if (authAttempts < maxAuthAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * authAttempts)
          );
        }
      }
    }

    const authDuration = Date.now() - authStartTime;
    console.log(
      `[${requestId}] 🔐 Auth check completed in ${authDuration}ms (${authAttempts} attempts)`
    );

    if (authError) {
      console.error(
        `[${requestId}] ❌ Auth failed after ${authAttempts} attempts:`,
        {
          message: authError.message,
          status: authError.status,
          attempts: authAttempts,
        }
      );
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
      console.warn(
        `[${requestId}] ⚠️ No authenticated user found after ${authAttempts} attempts`
      );
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
    const limit = Math.min(
      Math.max(1, parseInt(url.searchParams.get('limit') || '20')),
      100
    );
    const offset = (page - 1) * limit;
    const typeFilter = url.searchParams.get('type'); // Get type filter

    console.log(`[${requestId}] 📊 Query params:`, {
      page,
      limit,
      offset,
      type: typeFilter,
      userId: user.id,
    });

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
        console.log(
          `[${requestId}] 📝 Database query attempt ${queryAttempts}`
        );

        let query = supabase
          .from('parties')
          .select('*', { count: 'exact' });

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
          console.warn(
            `[${requestId}] ⚠️ Query attempt ${queryAttempts} failed:`,
            {
              message: queryError.message,
              code: queryError.code,
              hint: queryError.hint,
            }
          );

          // Wait before retry (exponential backoff)
          if (queryAttempts < maxQueryAttempts) {
            await new Promise(resolve =>
              setTimeout(resolve, 1000 * queryAttempts)
            );
          }
        }
      } catch (error) {
        console.error(
          `[${requestId}] 💥 Query attempt ${queryAttempts} threw error:`,
          error
        );
        queryError = error;

        if (queryAttempts < maxQueryAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * queryAttempts)
          );
        }
      }
    }

    const queryDuration = Date.now() - queryStartTime;
    console.log(
      `[${requestId}] 📝 Database query completed in ${queryDuration}ms (${queryAttempts} attempts)`
    );

    if (queryError) {
      console.error(
        `[${requestId}] ❌ Database query failed after ${queryAttempts} attempts:`,
        {
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint,
          code: queryError.code,
          attempts: queryAttempts,
        }
      );

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
      console.warn(
        `[${requestId}] ⚠️ Parties data is null - this might indicate a database issue`
      );
      parties = [];
    }

    if (!Array.isArray(parties)) {
      console.error(
        `[${requestId}] ❌ Parties data is not an array:`,
        typeof parties
      );
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
      console.log(`[${requestId}] ℹ️ No parties found (empty result set)`);
    } else {
      console.log(
        `[${requestId}] ✅ Retrieved ${parties.length} parties successfully`
      );
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Request completed successfully`, {
      resultCount: parties?.length || 0,
      totalCount: count || 0,
      duration: `${totalDuration}ms`,
      breakdown: {
        auth: `${authDuration}ms`,
        query: `${queryDuration}ms`,
      },
    });

    // Fetch contract counts for all parties
    const contractCountsStartTime = Date.now();
    const contractCounts: Record<string, { total: number; active: number }> =
      {};

    try {
      console.log(`[${requestId}] 📊 Fetching contract counts for parties`);

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
        console.warn(
          `[${requestId}] ⚠️ Failed to fetch contracts for counting:`,
          contractError.message
        );
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

        console.log(
          `[${requestId}] ✅ Contract counts calculated for ${Object.keys(contractCounts).length} parties`
        );
      }
    } catch (error) {
      console.error(
        `[${requestId}] ❌ Error fetching contract counts:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Continue with empty counts
    }

    const contractCountsDuration = Date.now() - contractCountsStartTime;
    console.log(
      `[${requestId}] 📊 Contract counts fetched in ${contractCountsDuration}ms`
    );

    // Transform data to include contract counts with validation
    const partiesWithCounts = parties.map(party => {
      try {
        // Validate required fields
        if (!party.id) {
          console.warn(`[${requestId}] ⚠️ Party missing ID:`, party);
        }
        if (!party.name_en && !party.name_ar) {
          console.warn(`[${requestId}] ⚠️ Party missing names:`, party.id);
        }

        // Get contract counts for this party
        const counts = contractCounts[party.id] || { total: 0, active: 0 };

        return {
          ...party,
          total_contracts: counts.total,
          active_contracts: counts.active,
        };
      } catch (error) {
        console.error(`[${requestId}] ❌ Error processing party:`, {
          partyId: party.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

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

    console.log(`[${requestId}] ✅ Response prepared:`, {
      partiesCount: partiesWithCounts.length,
      totalCount: count,
      duration: `${totalDuration}ms`,
    });

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

    console.error(`[${requestId}] 💥 Unexpected error:`, errorDetails);

    // Log to external service if configured (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorDetails });
      console.error(
        'Production error - consider logging to external service:',
        errorDetails
      );
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
      console.log('⚠️ RBAC BYPASS ENABLED - Running without permission checks');
      return handleGET(request);
    }
  : withRBAC('party:read:own', handleGET);

export async function POST(request: Request) {
  try {
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

    // Insert party into database
    const { data: party, error } = await supabase
      .from('parties')
      .insert([partyData])
      .select()
      .single();

    if (error) {
      console.error('Error creating party:', error);
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

    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
