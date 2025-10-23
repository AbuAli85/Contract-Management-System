import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/parties/[id]/promoters - Get promoters assigned to a specific employer
export const GET = withRBAC(
  'promoter:read:own',
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${requestId}] 🚀 Promoters by Employer API Request started`);
      
      const { id: employerId } = await params;
      
      if (!employerId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Employer ID is required' 
          },
          { status: 400 }
        );
      }

      // Validate environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
      }
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set');
      }
      
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      console.log(`[${requestId}] 📊 Fetching promoters for employer: ${employerId}`);

      // First, verify the employer exists
      const { data: employer, error: employerError } = await supabase
        .from('parties')
        .select('id, name_en, name_ar, type')
        .eq('id', employerId)
        .eq('type', 'Employer')
        .single();

      if (employerError || !employer) {
        console.warn(`[${requestId}] ⚠️ Employer not found:`, employerError?.message);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Employer not found or not an employer type',
            details: employerError?.message 
          },
          { status: 404 }
        );
      }

      // Fetch promoters assigned to this employer
      const { data: promoters, error: promotersError } = await supabase
        .from('promoters')
        .select(`
          id,
          name_en,
          name_ar,
          mobile_number,
          id_card_number,
          status,
          job_title,
          profile_picture_url,
          id_card_expiry_date,
          passport_expiry_date,
          created_at,
          updated_at
        `)
        .eq('employer_id', employerId)
        .order('created_at', { ascending: false });

      if (promotersError) {
        console.error(`[${requestId}] ❌ Error fetching promoters:`, promotersError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to fetch promoters',
            details: promotersError.message 
          },
          { status: 500 }
        );
      }

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ Successfully fetched ${promoters?.length || 0} promoters for employer ${employer.name_en} in ${duration}ms`);

      return NextResponse.json({
        success: true,
        employer: {
          id: employer.id,
          name_en: employer.name_en,
          name_ar: employer.name_ar,
          type: employer.type
        },
        promoters: promoters || [],
        count: promoters?.length || 0,
        _meta: {
          requestId,
          duration,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] ❌ Promoters by Employer API Error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
          _meta: {
            requestId,
            duration,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }
  }
);
