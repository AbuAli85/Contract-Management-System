import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validation schema for party data
const partySchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_ar: z.string().min(1, 'Arabic name is required'),
  crn: z.string().min(1, 'CRN is required'),
  type: z.enum(['Employer', 'Client', 'Generic']).default('Generic'),
  role: z.string().optional(),
  cr_expiry_date: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address_en: z.string().optional(),
  address_ar: z.string().optional(),
  tax_number: z.string().optional(),
  license_number: z.string().optional(),
  license_expiry_date: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
  notes: z.string().optional(),
});

export const GET = withRBAC('party:read:own', async (request: Request) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] 🚀 Parties API Request started`);
    
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

    // Get authenticated user with timeout
    const authStartTime = Date.now();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    const authDuration = Date.now() - authStartTime;

    console.log(`[${requestId}] 🔐 Auth check completed in ${authDuration}ms`);

    if (authError) {
      console.error(`[${requestId}] ❌ Auth error:`, {
        message: authError.message,
        status: authError.status,
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication failed',
          message: authError.message 
        }, 
        { status: 401 }
      );
    }

    if (!user) {
      console.warn(`[${requestId}] ⚠️ No authenticated user found`);
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource' 
        }, 
        { status: 401 }
      );
    }

    // Parse pagination from query params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(
      Math.max(1, parseInt(url.searchParams.get('limit') || '20')),
      100
    );
    const offset = (page - 1) * limit;

    console.log(`[${requestId}] 📊 Query params:`, { 
      page, 
      limit, 
      offset,
      userId: user.id 
    });

    // Fetch parties from the database with pagination
    const queryStartTime = Date.now();
    const { data: parties, error, count } = await supabase
      .from('parties')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    const queryDuration = Date.now() - queryStartTime;

    console.log(`[${requestId}] 📝 Database query completed in ${queryDuration}ms`);

    if (error) {
      console.error(`[${requestId}] ❌ Database error:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch parties',
          message: 'A database error occurred while fetching parties',
          details: process.env.NODE_ENV === 'development' 
            ? {
                message: error.message,
                code: error.code,
                hint: error.hint,
              }
            : undefined,
        },
        { status: 500 }
      );
    }

    // Check for empty results
    if (!parties || parties.length === 0) {
      console.log(`[${requestId}] ℹ️ No parties found (empty result set)`);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Request completed successfully`, {
      resultCount: parties?.length || 0,
      totalCount: count || 0,
      duration: `${totalDuration}ms`,
      breakdown: {
        auth: `${authDuration}ms`,
        query: `${queryDuration}ms`,
      }
    });

    // Transform data to include basic information
    // Contract counts will be calculated separately to avoid foreign key issues
    const partiesWithCounts = parties?.map(party => ({
      ...party,
      total_contracts: 0, // Will be calculated separately
      active_contracts: 0, // Will be calculated separately
    }));

    return NextResponse.json({
      success: true,
      parties: partiesWithCounts || [],
      count: parties?.length || 0,
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
      _meta: process.env.NODE_ENV === 'development' ? {
        requestId,
        duration: `${totalDuration}ms`,
      } : undefined,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    console.error(`[${requestId}] 💥 Unexpected error:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        details: process.env.NODE_ENV === 'development'
          ? {
              message: error instanceof Error ? error.message : 'Unknown error',
              type: error instanceof Error ? error.constructor.name : typeof error,
            }
          : undefined,
        _meta: process.env.NODE_ENV === 'development' ? {
          requestId,
          duration: `${totalDuration}ms`,
        } : undefined,
      },
      { status: 500 }
    );
  }
});

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
