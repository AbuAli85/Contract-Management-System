import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for imported promoter data
const importPromoterSchema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().optional(),
  id_card_number: z.string().min(1),
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
  promoters: z.array(importPromoterSchema),
});

export async function POST(request: Request) {
  try {
    console.log('🔍 API /api/promoters/import POST called');

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = importRequestSchema.safeParse(body);

    if (!validation.success) {
      console.error('❌ Validation error:', validation.error);
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
    console.log(`📊 Importing ${promoters.length} promoters...`);

    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];
    let importedWithCompany = 0;

    // Import promoters one by one (could be batched for better performance)
    for (const promoter of promoters) {
      try {
        // Check if promoter with this ID card already exists
        const { data: existing, error: checkError } = await supabase
          .from('promoters')
          .select('id')
          .eq('id_card_number', promoter.id_card_number)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows
          console.error(
            `❌ Error checking duplicate for ${promoter.id_card_number}:`,
            checkError
          );
          errors.push(
            `Error checking ${promoter.name_en}: ${checkError.message}`
          );
          continue;
        }

        if (existing) {
          console.log(
            `⚠️  Duplicate: ${promoter.name_en} (${promoter.id_card_number})`
          );
          duplicates++;
          continue;
        }

        // Insert the promoter
        const { error: insertError } = await supabase.from('promoters').insert({
          name_en: promoter.name_en,
          name_ar: promoter.name_ar || promoter.name_en,
          id_card_number: promoter.id_card_number,
          passport_number: promoter.passport_number,
          mobile_number: promoter.mobile_number,
          email: promoter.email,
          status: promoter.status || 'active',
          employer_id: promoter.employer_id,
          nationality: promoter.nationality,
          id_card_expiry_date: promoter.id_card_expiry_date,
          passport_expiry_date: promoter.passport_expiry_date,
          notify_days_before_id_expiry:
            promoter.notify_days_before_id_expiry || 100,
          notify_days_before_passport_expiry:
            promoter.notify_days_before_passport_expiry || 210,
        });

        if (insertError) {
          console.error(`❌ Error inserting ${promoter.name_en}:`, insertError);
          errors.push(
            `Error inserting ${promoter.name_en}: ${insertError.message}`
          );
          continue;
        }

        imported++;
        if (promoter.employer_id) {
          importedWithCompany++;
        }
        console.log(`✅ Imported: ${promoter.name_en}`);
      } catch (error: any) {
        console.error(`❌ Unexpected error for ${promoter.name_en}:`, error);
        errors.push(
          `Unexpected error for ${promoter.name_en}: ${error.message}`
        );
      }
    }

    console.log(
      `✅ Import complete: ${imported} imported, ${duplicates} duplicates, ${errors.length} errors`
    );

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      errors,
      importedWithCompany,
      total: promoters.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
