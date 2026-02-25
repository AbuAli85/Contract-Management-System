import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';
import { extractIdFromSlug, isUUID } from '@/lib/utils/slug';

// Validation schema for promoter updates
// Using passthrough to allow all valid database fields while validating known ones
const promoterUpdateSchema = z
  .object({
    // Names
    name_en: z.string().min(1, 'English name is required').optional(),
    name_ar: z.string().min(1, 'Arabic name is required').optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),

    // Documents
    id_card_number: z.string().min(1, 'ID card number is required').optional(),
    id_card_url: z.string().optional(),
    id_card_expiry_date: z.string().or(z.date()).optional(),
    passport_url: z.string().optional(),
    passport_number: z.string().optional(),
    passport_expiry_date: z.string().or(z.date()).optional(),
    visa_number: z.string().optional(),
    visa_expiry_date: z.string().or(z.date()).optional(),
    work_permit_number: z.string().optional(),
    work_permit_expiry_date: z.string().or(z.date()).optional(),

    // Contact
    mobile_number: z.string().optional(),
    phone: z.string().optional(),
    email: z
      .string()
      .refine(
        val => !val || val === '' || z.string().email().safeParse(val).success,
        { message: 'Invalid email format' }
      )
      .optional(),
    profile_picture_url: z.string().optional(),

    // Personal info
    nationality: z.string().optional(),
    date_of_birth: z.string().or(z.date()).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    marital_status: z.string().optional(),

    // Address
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional(),
    emergency_contact: z.string().optional(),
    emergency_phone: z.string().optional(),

    // Professional
    job_title: z.string().optional(),
    company: z.string().optional(),
    department: z.string().optional(),
    specialization: z.string().optional(),
    experience_years: z.number().optional(),
    education_level: z.string().optional(),
    university: z.string().optional(),
    graduation_year: z.number().optional(),
    skills: z.string().optional(),
    certifications: z.string().optional(),

    // Financial
    bank_name: z.string().optional(),
    account_number: z.string().optional(),
    iban: z.string().optional(),
    swift_code: z.string().optional(),
    tax_id: z.string().optional(),

    // Status & preferences
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
    overall_status: z.string().optional(),
    rating: z.number().optional(),
    availability: z.string().optional(),
    preferred_language: z.string().optional(),
    timezone: z.string().optional(),
    special_requirements: z.string().optional(),
    notes: z.string().optional(),

    // Relationships
    employer_id: z.string().uuid().optional(),

    // Notifications
    notify_days_before_id_expiry: z.number().min(1).max(365).optional(),
    notify_days_before_passport_expiry: z.number().min(1).max(365).optional(),
  })
  .passthrough(); // Allow additional fields that exist in the database but aren't explicitly listed

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

      const userId = session.user.id;

      // Handle both UUID and slug-based lookups
      const isFullUUID = isUUID(id);
      const searchId = isFullUUID ? id : extractIdFromSlug(id);

      // ✅ AUTO-FIX: If user is accessing their own profile, ensure they have promoter role
      if (searchId === userId) {
        try {
          const { ensurePromoterRole } =
            await import('@/lib/services/employee-account-service');
          await ensurePromoterRole(userId);
        } catch (roleError) {
          // Continue anyway - the RBAC check will handle it
        }
      }

      // Fetch promoter data (simplified to avoid relationship issues)
      let promoterQuery = supabase.from('promoters').select('*');

      if (isFullUUID) {
        // Exact match for full UUID
        promoterQuery = promoterQuery.eq('id', searchId);
      } else {
        // Partial match for slug (search by first 8 characters of UUID)
        promoterQuery = promoterQuery.like('id', `${searchId}%`);
      }

      let { data: promoter, error } = await promoterQuery.maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch promoter' },
          { status: 500 }
        );
      }

      // ✅ AUTO-FIX: If user is accessing their own profile and promoter record doesn't exist, create it
      if (!promoter && searchId === userId) {

        try {
          // Get user profile to populate promoter data
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('email, full_name, phone')
            .eq('id', userId)
            .single();

          if (userProfile) {
            // Create promoter record using admin client to bypass RLS
            const { getSupabaseAdmin } = await import('@/lib/supabase/admin');
            const supabaseAdmin = getSupabaseAdmin();

            // Use upsert to handle case where record might already exist
            const promoterData = {
              id: userId,
              email: userProfile.email || session.user.email || '',
              name_en:
                userProfile.full_name ||
                session.user.user_metadata?.full_name ||
                'User',
              name_ar:
                userProfile.full_name ||
                session.user.user_metadata?.full_name ||
                'User',
              phone: userProfile.phone || null,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data: newPromoter, error: createError } =
              await supabaseAdmin
                .from('promoters')
                .upsert(promoterData, { onConflict: 'id' })
                .select()
                .single();

            if (createError) {
              return NextResponse.json(
                {
                  error: 'Failed to create promoter record',
                  details: createError.message,
                  code: createError.code,
                },
                { status: 500 }
              );
            }

            if (!newPromoter) {
              return NextResponse.json(
                {
                  error: 'Failed to create promoter record - no data returned',
                },
                { status: 500 }
              );
            }


            // Re-fetch the promoter using admin client to ensure we can read it
            const { data: refetchedPromoter } = await supabaseAdmin
              .from('promoters')
              .select('*')
              .eq('id', userId)
              .maybeSingle();

            if (!refetchedPromoter) {
              return NextResponse.json(
                { error: 'Failed to fetch newly created promoter' },
                { status: 500 }
              );
            }

            // Continue with normal flow below (will fetch employer and contracts)
            // Set promoter to the refetched one so the code below handles it
            promoter = refetchedPromoter;
          } else {
            return NextResponse.json(
              { error: 'User profile not found' },
              { status: 404 }
            );
          }
        } catch (autoFixError) {
          return NextResponse.json(
            { error: 'Failed to create promoter record' },
            { status: 500 }
          );
        }
      }

      if (!promoter) {
        return NextResponse.json(
          { error: 'Promoter not found' },
          { status: 404 }
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
        // Continue without contracts rather than failing the entire request
      }

      if (error) {
        if ((error as any).code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Promoter not found' },
            { status: 404 }
          );
        }
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

      // Log the incoming request for debugging

      let validatedData;
      try {
        validatedData = promoterUpdateSchema.parse(body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Validation error',
              details: validationError.issues,
            },
            { status: 400 }
          );
        }
        throw validationError;
      }

      // Check if ID card number is being updated and if it already exists
      if (validatedData.id_card_number) {
        const { data: existingPromoter, error: checkError } = await supabase
          .from('promoters')
          .select('id')
          .eq('id_card_number', validatedData.id_card_number)
          .neq('id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
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

      // Convert date strings to proper format for database
      const updateData: Record<string, any> = {
        ...validatedData,
        updated_at: new Date().toISOString(),
      };

      // Convert ISO date strings to date format for date fields
      const dateFields = [
        'id_card_expiry_date',
        'passport_expiry_date',
        'visa_expiry_date',
        'work_permit_expiry_date',
        'date_of_birth',
      ];

      for (const field of dateFields) {
        if (updateData[field]) {
          // If it's a string, try to parse it; if it's already a Date, use it
          if (typeof updateData[field] === 'string') {
            const date = new Date(updateData[field]);
            if (!isNaN(date.getTime())) {
              // Format as YYYY-MM-DD for PostgreSQL DATE type
              updateData[field] = date.toISOString().split('T')[0];
            } else {
              // Invalid date, remove it
              delete updateData[field];
            }
          } else if (updateData[field] instanceof Date) {
            updateData[field] = updateData[field].toISOString().split('T')[0];
          }
        }
      }

      // Remove null/undefined values to avoid constraint issues (but keep empty strings for text fields)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Update promoter in database
      const { data: promoter, error } = await supabase
        .from('promoters')
        .update(updateData)
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

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// PATCH method for Supabase compatibility (same as PUT but with different validation)
export const PATCH = withRBAC(
  'promoter:update',
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      // Log the incoming request for debugging

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

      // Log the incoming request for debugging

      let validatedData;
      try {
        validatedData = promoterUpdateSchema.parse(body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Validation error',
              details: validationError.issues,
            },
            { status: 400 }
          );
        }
        throw validationError;
      }

      // Check if ID card number is being updated and if it already exists
      if (validatedData.id_card_number) {
        const { data: existingPromoter, error: checkError } = await supabase
          .from('promoters')
          .select('id')
          .eq('id_card_number', validatedData.id_card_number)
          .neq('id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
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

      // Convert date strings to proper format for database
      const updateData: Record<string, any> = {
        ...validatedData,
        updated_at: new Date().toISOString(),
      };

      // Convert ISO date strings to date format for date fields
      const dateFields = [
        'id_card_expiry_date',
        'passport_expiry_date',
        'visa_expiry_date',
        'work_permit_expiry_date',
        'date_of_birth',
      ];

      for (const field of dateFields) {
        if (updateData[field]) {
          // If it's a string, try to parse it; if it's already a Date, use it
          if (typeof updateData[field] === 'string') {
            const date = new Date(updateData[field]);
            if (!isNaN(date.getTime())) {
              // Format as YYYY-MM-DD for PostgreSQL DATE type
              updateData[field] = date.toISOString().split('T')[0];
            } else {
              // Invalid date, remove it
              delete updateData[field];
            }
          } else if (updateData[field] instanceof Date) {
            updateData[field] = updateData[field].toISOString().split('T')[0];
          }
        }
      }

      // Remove null/undefined values to avoid constraint issues (but keep empty strings for text fields)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Update promoter in database
      const { data: promoter, error } = await supabase
        .from('promoters')
        .update(updateData)
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
        // Don't fail the request if audit logging fails
      }

      return NextResponse.json({
        success: true,
        message: 'Promoter deleted successfully',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
