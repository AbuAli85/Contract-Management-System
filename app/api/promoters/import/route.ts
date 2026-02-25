import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ratelimitStrict,
  getClientIdentifier,
  getRateLimitHeaders,
  createRateLimitResponse,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Validation schema for imported promoter data
const importPromoterSchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_ar: z.string().optional(),
  id_card_number: z.string().min(1, 'ID card number is required'),
  passport_number: z.string().optional(),
  mobile_number: z.string().optional(),
  email: z.string().email().optional().nullable(),
  status: z.string().optional().default('active'),
  employer_id: z.string().uuid().optional().nullable(),
  nationality: z.string().optional(),
  id_card_expiry_date: z.string().optional().nullable(),
  passport_expiry_date: z.string().optional().nullable(),
  notify_days_before_id_expiry: z.number().optional().default(100),
  notify_days_before_passport_expiry: z.number().optional().default(210),
});

const importRequestSchema = z.object({
  promoters: z
    .array(importPromoterSchema)
    .min(1, 'At least one promoter is required')
    .max(500, 'Cannot import more than 500 promoters at once'),
});

export async function POST(request: Request) {
  try {
    // ✅ SECURITY: Apply rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await ratelimitStrict.limit(identifier);
    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders(rateLimitResult);
      const body = createRateLimitResponse(rateLimitResult);
      return NextResponse.json(body, {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // ✅ SECURITY: Use anon key with RLS (not service role key)
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // Ignore cookie setting errors in middleware
          }
        },
      },
    });

    // ✅ SECURITY: Verify authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          details: 'Please log in to import promoters',
        },
        { status: 401 }
      );
    }

    // ✅ SECURITY: Check user role — only admins and managers can import
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['admin', 'manager', 'employer'];
    if (!userProfile || !allowedRoles.includes(userProfile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          details: 'Only admins and managers can import promoters',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = importRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { promoters } = validation.data;

    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];
    let importedWithCompany = 0;

    // Batch check for existing ID card numbers to avoid N+1 queries
    const idCardNumbers = promoters.map(p => p.id_card_number);
    const { data: existingPromoters } = await supabase
      .from('promoters')
      .select('id_card_number')
      .in('id_card_number', idCardNumbers);

    const existingIdCards = new Set(
      (existingPromoters || []).map(p => p.id_card_number)
    );

    // Filter out duplicates
    const newPromoters = promoters.filter(p => {
      if (existingIdCards.has(p.id_card_number)) {
        duplicates++;
        return false;
      }
      return true;
    });

    // Batch insert new promoters in chunks of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < newPromoters.length; i += BATCH_SIZE) {
      const batch = newPromoters.slice(i, i + BATCH_SIZE);
      const insertData = batch.map(promoter => ({
        name_en: promoter.name_en,
        name_ar: promoter.name_ar || promoter.name_en,
        id_card_number: promoter.id_card_number,
        passport_number: promoter.passport_number || null,
        mobile_number: promoter.mobile_number || null,
        email: promoter.email || null,
        status: promoter.status || 'active',
        employer_id: promoter.employer_id || null,
        nationality: promoter.nationality || null,
        id_card_expiry_date: promoter.id_card_expiry_date || null,
        passport_expiry_date: promoter.passport_expiry_date || null,
        notify_days_before_id_expiry:
          promoter.notify_days_before_id_expiry || 100,
        notify_days_before_passport_expiry:
          promoter.notify_days_before_passport_expiry || 210,
        created_by: user.id,
      }));

      const { error: insertError, data: insertedData } = await supabase
        .from('promoters')
        .insert(insertData)
        .select('id, employer_id');

      if (insertError) {
        errors.push(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${insertError.message}`
        );
        continue;
      }

      imported += insertedData?.length || batch.length;
      importedWithCompany += (insertedData || []).filter(
        p => p.employer_id
      ).length;
    }

    const responseHeaders = getRateLimitHeaders(rateLimitResult);
    return NextResponse.json(
      {
        success: true,
        imported,
        duplicates,
        errors,
        importedWithCompany,
        total: promoters.length,
        timestamp: new Date().toISOString(),
      },
      { headers: responseHeaders }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
