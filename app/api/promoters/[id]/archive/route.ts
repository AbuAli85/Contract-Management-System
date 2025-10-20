import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC } from '@/lib/rbac/guard';
import { ratelimitStrict, getClientIdentifier, getRateLimitHeaders, createRateLimitResponse } from '@/lib/rate-limit';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validation schema for archive requests
const archiveSchema = z.object({
  archived: z.boolean().default(true),
  reason: z.string().optional(),
});

// ✅ SECURITY: RBAC enabled with rate limiting
export const PUT = withRBAC('promoter:manage:own', async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    // ✅ SECURITY: Apply rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await ratelimitStrict.limit(identifier);
    
    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders(rateLimitResult);
      const body = createRateLimitResponse(rateLimitResult);
      
      return NextResponse.json(body, {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
    }

    console.log('🔍 API /api/promoters/[id]/archive PUT called (RBAC ENABLED, Rate Limited)');
      
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // ✅ SECURITY: Using ANON key with RLS policies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {}
        },
      } as any,
    });

    // ✅ SECURITY: Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          details: 'Please log in to archive promoters'
        },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', user.email);

    const promoterId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = archiveSchema.parse(body);

    const { archived, reason } = validatedData;

    console.log('📁 Archive request:', { promoterId, archived, reason });

    // Fetch promoter data first to verify it exists
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, status')
      .eq('id', promoterId)
      .single();

    if (promoterError || !promoter) {
      console.error('❌ Promoter not found:', promoterError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Promoter not found',
          details: 'The specified promoter does not exist or you do not have access'
        },
        { status: 404 }
      );
    }

    // Update promoter status
    const newStatus = archived ? 'archived' : 'active';
    const { data: updatedPromoter, error: updateError } = await supabase
      .from('promoters')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', promoterId)
      .select('id, name_en, name_ar, status')
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update promoter status',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    // Create audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: archived ? 'archive' : 'unarchive',
        table_name: 'promoters',
        record_id: promoterId,
        old_values: { status: promoter.status },
        new_values: { 
          status: newStatus,
          reason: reason || null
        },
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    const result = {
      success: true,
      message: `Promoter ${archived ? 'archived' : 'unarchived'} successfully`,
      promoter: {
        id: updatedPromoter.id,
        name: updatedPromoter.name_en || updatedPromoter.name_ar,
        status: updatedPromoter.status
      }
    };

    console.log(`✅ Archive action completed: ${result.message}`);
    
    // Add rate limit headers to response
    const responseHeaders = getRateLimitHeaders(rateLimitResult);
    
    return NextResponse.json(result, {
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('❌ API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : undefined
      },
      { status: 500 }
    );
  }
});
