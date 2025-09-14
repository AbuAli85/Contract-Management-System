import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

type PromoterRow = {
  name_en: string;
  name_ar?: string;
  id_card_number: string;
  mobile_number?: string;
  passport_number?: string;
  nationality?: string;
  id_card_expiry_date?: string | null;
  passport_expiry_date?: string | null;
  notes?: string;
  status?: string;
  employer_id?: string;
};

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        { error: 'Server configuration error: Supabase credentials missing' },
        { status: 500 }
      );
    }

    const admin = createAdminClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await request.json().catch(() => null);
    const rows: PromoterRow[] = body?.promoters || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No promoter data provided' },
        { status: 400 }
      );
    }

    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];
    let importedWithCompany = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // header is row 1

      // Basic validation
      if (!row?.name_en || !row?.id_card_number) {
        errors.push(`Row ${rowNum}: Missing required fields (Name EN and ID Card Number)`);
        continue;
      }

      try {
        // Check existing promoter by id_card_number
        const { data: existing, error: checkError } = await admin
          .from('promoters')
          .select('id, employer_id')
          .eq('id_card_number', row.id_card_number)
          .maybeSingle();

        if (checkError) {
          errors.push(`Row ${rowNum}: Error checking existing promoter - ${checkError.message}`);
          continue;
        }

        // Validate employer if provided
        let employerId: string | undefined = row.employer_id?.trim() || undefined;
        if (employerId) {
          const { data: companyData, error: companyError } = await admin
            .from('parties')
            .select('id')
            .eq('id', employerId)
            .eq('type', 'Employer')
            .maybeSingle();
          if (companyError || !companyData) {
            // Invalid employer; ignore instead of failing the row
            employerId = undefined;
          }
        }

        if (existing) {
          // Existing promoter
          if (!existing.employer_id && employerId) {
            const { error: updateError } = await admin
              .from('promoters')
              .update({ employer_id: employerId })
              .eq('id', existing.id);
            if (updateError) {
              errors.push(`Row ${rowNum}: Failed to assign company to existing promoter`);
              continue;
            }
            imported += 1;
            importedWithCompany += 1;
          } else {
            duplicates += 1;
            errors.push(`Row ${rowNum}: Promoter with ID card number ${row.id_card_number} already exists`);
          }
          continue;
        }

        // Insert new promoter
        const payload: any = {
          name_en: row.name_en,
          name_ar: row.name_ar || null,
          id_card_number: row.id_card_number,
          mobile_number: row.mobile_number || null,
          passport_number: row.passport_number || null,
          nationality: row.nationality || null,
          id_card_expiry_date: row.id_card_expiry_date || null,
          passport_expiry_date: row.passport_expiry_date || null,
          notes: row.notes || null,
          status: row.status || 'active',
        };
        if (employerId) payload.employer_id = employerId;

        const { error: insertError } = await admin.from('promoters').insert(payload);
        if (insertError) {
          let message = insertError.message;
          if (insertError.code === '22008') {
            message = 'Invalid date format. Please use DD/MM/YYYY or DD-MM-YYYY';
          } else if (insertError.code === '23505') {
            message = 'Duplicate entry. This promoter already exists';
          } else if (insertError.code === '23503') {
            message = 'Invalid company ID. Please check the company reference';
          }
          errors.push(`Row ${rowNum}: ${message}`);
          continue;
        }

        imported += 1;
        if (employerId) importedWithCompany += 1;
      } catch (err: any) {
        errors.push(`Row ${rowNum}: ${err?.message || 'Unknown error'}`);
      }
    }

    return NextResponse.json({ imported, duplicates, errors, importedWithCompany });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}


