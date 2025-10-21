import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';
import { extractIdFromSlug, isUUID } from '@/lib/utils/slug';

// Validation schema for promoter updates
const promoterUpdateSchema = z.object({
  name_en: z.string().min(1, 'English name is required').optional(),
  name_ar: z.string().min(1, 'Arabic name is required').optional(),
  id_card_number: z.string().min(1, 'ID card number is required').optional(),
  id_card_url: z.string().optional(),
  passport_url: z.string().optional(),
  passport_number: z.string().optional(),
  mobile_number: z.string().optional(),
  profile_picture_url: z.string().optional(),
  status: z
    .enum([
      'active',
      'inactive',
      'suspended',
      'holiday',
      'on_leave',
      'terminated',
      'pending_approval',
      'retired',
      'probation',
      'resigned',
      'contractor',
      'temporary',
      'training',
      'other',
    ])
    .optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  nationality: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
  employer_id: z.string().uuid().optional(),
  notify_days_before_id_expiry: z.number().min(1).max(365).optional(),
  notify_days_before_passport_expiry: z.number().min(1).max(365).optional(),
});

export const GET = withAnyRBAC(
  ['promoter:read:own', 'promoter:manage:own'],
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet: any) {
              try {
                cookiesToSet.forEach(({ name, value, ...options }: any) => {
                  cookieStore.set(
                    name,
                    value,
                    options as {
                      path?: string;
                      domain?: string;
                      maxAge?: number;
                      secure?: boolean;
                      httpOnly?: boolean;
                      sameSite?: 'strict' | 'lax' | 'none';
                    }
                  );
                });
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          } as any,
        }
      );

      // Get user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Handle both UUID and slug-based lookups
      const isFullUUID = isUUID(id);
      const searchId = isFullUUID ? id : extractIdFromSlug(id);
      
      // Fetch promoter data (simplified to avoid relationship issues)
      let promoterQuery = supabase.from('promoters').select('*');
      
      if (isFullUUID) {
        // Exact match for full UUID
        promoterQuery = promoterQuery.eq('id', searchId);
      } else {
        // Partial match for slug (search by first 8 characters of UUID)
        promoterQuery = promoterQuery.like('id', `${searchId}%`);
      }
      
      const { data: promoter, error } = await promoterQuery.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Promoter not found' },
            { status: 404 }
          );
        }
        console.error('Error fetching promoter:', error);
        return NextResponse.json(
          { error: 'Failed to fetch promoter' },
          { status: 500 }
        );
      }

      // Fetch employer data separately
      let employer = null;
      if (promoter.employer_id) {
        try {
          const { data: employerData, error: employerError } = await supabase
            .from('parties')
            .select('id, name_en, name_ar')
            .eq('id', promoter.employer_id);

          if (!employerError && employerData && employerData.length > 0) {
            employer = employerData[0];
          }
        } catch (employerError) {
          console.warn('Could not fetch employer data:', employerError);
          // Continue without employer data rather than failing the entire request
        }
      }

      // Fetch contracts data separately (simplified to avoid relationship issues)
      let contracts: any[] = [];
      try {
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select(
            'id, contract_number, status, contract_start_date, contract_end_date, job_title, work_location, first_party_id, second_party_id'
          )
          .eq('promoter_id', id);

        if (!contractsError && contractsData) {
          contracts = contractsData.map(contract => ({
            ...contract,
            first_party: null, // Will be populated separately if needed
            second_party: null, // Will be populated separately if needed
          }));
        }
      } catch (contractError) {
        console.warn('Could not fetch contracts:', contractError);
        // Continue without contracts rather than failing the entire request
      }

      if (error) {
        if ((error as any).code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Promoter not found' },
            { status: 404 }
          );
        }
        console.error('Error fetching promoter:', error);
        return NextResponse.json(
          { error: 'Failed to fetch promoter' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        promoter: {
          ...promoter,
          employer,
          contracts,
        },
      });
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// ✅ SECURITY FIX: Added RBAC guard for promoter updates
export const PUT = withRBAC(
  'promoter:update',
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet: any) {
              try {
                cookiesToSet.forEach(({ name, value, ...options }: any) => {
                  cookieStore.set(
                    name,
                    value,
                    options as {
                      path?: string;
                      domain?: string;
                      maxAge?: number;
                      secure?: boolean;
                      httpOnly?: boolean;
                      sameSite?: 'strict' | 'lax' | 'none';
                    }
                  );
                });
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          } as any,
        }
      );

      // Get user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Parse and validate request body
      const body = await request.json();
      const validatedData = promoterUpdateSchema.parse(body);

      // Check if ID card number is being updated and if it already exists
      if (validatedData.id_card_number) {
        const { data: existingPromoter, error: checkError } = await supabase
          .from('promoters')
          .select('id')
          .eq('id_card_number', validatedData.id_card_number)
          .neq('id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking ID card number:', checkError);
          return NextResponse.json(
            { error: 'Failed to validate ID card number' },
            { status: 500 }
          );
        }

        if (existingPromoter) {
          return NextResponse.json(
            { error: 'ID card number already exists for another promoter' },
            { status: 400 }
          );
        }
      }

      // Update promoter in database
      const { data: promoter, error } = await supabase
        .from('promoters')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Promoter not found' },
            { status: 404 }
          );
        }
        console.error('Error updating promoter:', error);
        return NextResponse.json(
          {
            error: 'Failed to update promoter',
            details: error.message,
          },
          { status: 500 }
        );
      }

      // After successful update, create audit log
      try {
        await supabase.from('audit_logs').insert({
          user_id: session.user.id,
          action: 'update',
          table_name: 'promoters',
          record_id: id,
          new_values: validatedData,
          created_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
        // Don't fail the request if audit logging fails
      }

      return NextResponse.json({
        success: true,
        promoter,
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
);

// ✅ SECURITY FIX: Added RBAC guard for promoter deletion
export const DELETE = withRBAC(
  'promoter:delete',
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet: any) {
              try {
                cookiesToSet.forEach(({ name, value, ...options }: any) => {
                  cookieStore.set(
                    name,
                    value,
                    options as {
                      path?: string;
                      domain?: string;
                      maxAge?: number;
                      secure?: boolean;
                      httpOnly?: boolean;
                      sameSite?: 'strict' | 'lax' | 'none';
                    }
                  );
                });
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          } as any,
        }
      );

      // Get user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has permission to delete (admin or manager)
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      // Check if promoter has active contracts
      const { data: activeContracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id')
        .eq('promoter_id', id)
        .eq('status', 'active');

      if (contractsError) {
        console.error('Error checking contracts:', contractsError);
        return NextResponse.json(
          { error: 'Failed to check contracts' },
          { status: 500 }
        );
      }

      if (activeContracts && activeContracts.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete promoter with active contracts',
            activeContractsCount: activeContracts.length,
          },
          { status: 400 }
        );
      }

      // Delete promoter
      const { error } = await supabase.from('promoters').delete().eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Promoter not found' },
            { status: 404 }
          );
        }
        console.error('Error deleting promoter:', error);
        return NextResponse.json(
          {
            error: 'Failed to delete promoter',
            details: error.message,
          },
          { status: 500 }
        );
      }

      // After successful delete, create audit log
      try {
        await supabase.from('audit_logs').insert({
          user_id: session.user.id,
          action: 'delete',
          table_name: 'promoters',
          record_id: id,
          created_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
        // Don't fail the request if audit logging fails
      }

      return NextResponse.json({
        success: true,
        message: 'Promoter deleted successfully',
      });
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
