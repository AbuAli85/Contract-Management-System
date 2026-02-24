import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for bulk operations

interface FixResult {
  promoterId: string;
  promoterName: string;
  fixedIdCard: boolean;
  fixedPassport: boolean;
  idCardUrl?: string;
  passportUrl?: string;
  error?: string;
}

function normalizeFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: 'Please log in to use this feature',
        },
        { status: 401 }
      );
    }

    // Fetch all promoters with missing URLs
    // Using service role to bypass RLS for this admin operation
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select(
        'id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url'
      );

    if (promotersError) {
      return NextResponse.json(
        { error: 'Failed to fetch promoters', details: promotersError.message },
        { status: 500 }
      );
    }

    if (!promoters || promoters.length === 0) {
      return NextResponse.json({
        success: true,
        fixed: [],
        message: 'No promoters found',
      });
    }

    const results: FixResult[] = [];
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    for (const promoter of promoters) {
      const result: FixResult = {
        promoterId: promoter.id,
        promoterName: promoter.name_en || '',
        fixedIdCard: false,
        fixedPassport: false,
      };

      try {
        const updates: any = {};

        // Fix ID Card URL if missing
        if (!promoter.id_card_url && promoter.id_card_number) {
          // Try different filename patterns
          const normalizedName = normalizeFilename(promoter.name_en || '');
          const possibleIdCardNames = [
            `${normalizedName}_${promoter.id_card_number}.png`,
            `${normalizedName}_${promoter.id_card_number}.jpeg`,
            `${normalizedName}_${promoter.id_card_number}.jpg`,
            `${normalizedName.replace(/_/g, ' ')}_${promoter.id_card_number}.png`,
            `${normalizedName.replace(/_/g, ' ')}_${promoter.id_card_number}.jpeg`,
          ];

          for (const filename of possibleIdCardNames) {
            const constructedUrl = `${projectUrl}/storage/v1/object/public/promoter-documents/${filename}`;

            // Check if file exists by trying to get it
            const { data: fileCheck } = await supabase.storage
              .from('promoter-documents')
              .list('', {
                search: filename,
                limit: 1,
              });

            if (fileCheck && fileCheck.length > 0) {
              updates.id_card_url = constructedUrl;
              result.fixedIdCard = true;
              result.idCardUrl = constructedUrl;
              break;
            }
          }
        }

        // Fix Passport URL if missing
        if (!promoter.passport_url && promoter.passport_number) {
          const normalizedName = normalizeFilename(promoter.name_en || '');
          const possiblePassportNames = [
            `${normalizedName}_${promoter.passport_number}.png`,
            `${normalizedName}_${promoter.passport_number}.jpeg`,
            `${normalizedName}_${promoter.passport_number}.jpg`,
            `${normalizedName}_${promoter.passport_number.toUpperCase()}.png`,
            `${normalizedName}_${promoter.passport_number.toUpperCase()}.jpeg`,
            `${normalizedName}_NO_PASSPORT.png`,
            `${normalizedName}_NO_PASSPORT.jpeg`,
          ];

          for (const filename of possiblePassportNames) {
            const constructedUrl = `${projectUrl}/storage/v1/object/public/promoter-documents/${filename}`;

            const { data: fileCheck } = await supabase.storage
              .from('promoter-documents')
              .list('', {
                search: filename,
                limit: 1,
              });

            if (fileCheck && fileCheck.length > 0) {
              updates.passport_url = constructedUrl;
              result.fixedPassport = true;
              result.passportUrl = constructedUrl;
              break;
            }
          }
        }

        // Update database if we found any URLs
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('promoters')
            .update(updates)
            .eq('id', promoter.id);

          if (updateError) {
            result.error = updateError.message;
          }
        }

        if (result.fixedIdCard || result.fixedPassport) {
          results.push(result);
        }
      } catch (err) {
        result.error = err instanceof Error ? err.message : 'Unknown error';
        results.push(result);
      }
    }

    return NextResponse.json({
      success: true,
      fixed: results,
      summary: {
        totalFixed: results.length,
        idCardsFixed: results.filter(r => r.fixedIdCard).length,
        passportsFixed: results.filter(r => r.fixedPassport).length,
        errors: results.filter(r => r.error).length,
      },
    });
  } catch (error) {
    console.error('Bulk fix error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
