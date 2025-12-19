/**
 * Utility function to ensure an employer_employee record exists for a promoter
 * This allows promoters to be treated as full employees with access to all features
 */

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface EnsureEmployeeResult {
  employerEmployeeId: string;
  isNew: boolean;
}

/**
 * Ensures an employer_employee record exists for the given ID
 * If the ID is a promoter ID (starts with 'promoter_'), automatically creates the record
 * @param id - Either an employer_employee ID or a promoter ID (with 'promoter_' prefix)
 * @param userId - The current user's ID (for authorization)
 * @returns The employer_employee ID and whether it was newly created
 */
export async function ensureEmployerEmployeeRecord(
  id: string,
  userId: string
): Promise<EnsureEmployeeResult> {
  const supabase = await createClient();
  const supabaseAdmin = getSupabaseAdmin();

  // If it's not a promoter ID, assume it's already an employer_employee ID
  if (!id.startsWith('promoter_')) {
    // Verify it exists
    const { data: existing } = await supabaseAdmin
      .from('employer_employees')
      .select('id')
      .eq('id', id)
      .single();

    if (existing) {
      return { employerEmployeeId: id, isNew: false };
    }
    // If not found, treat as invalid
    throw new Error(`Employer employee record not found: ${id}`);
  }

  // Extract promoter ID
  const promoterId = id.replace('promoter_', '');

  // Get user's profile and company
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('active_company_id, email')
    .eq('id', userId)
    .single();

  if (!userProfile) {
    throw new Error('User profile not found');
  }

  // Get promoter details
  const { data: promoter, error: promoterError } = await supabase
    .from('promoters')
    .select('id, email, name_en, name_ar, employer_id, status, created_at')
    .eq('id', promoterId)
    .single();

  if (promoterError || !promoter) {
    throw new Error(`Promoter not found: ${promoterId}`);
  }

  // Get employer party details
  const { data: party } = await supabase
    .from('parties')
    .select('id, contact_email')
    .eq('id', promoter.employer_id)
    .single();

  if (!party) {
    throw new Error(`Employer party not found for promoter: ${promoterId}`);
  }

  // Find employer profile (from party contact_email)
  const { data: employerProfile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', party.contact_email || '')
    .single();

  if (!employerProfile) {
    throw new Error(`Employer profile not found for party: ${party.id}`);
  }

  // Find employee profile (from promoter email)
  const { data: employeeProfile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', promoter.email || '')
    .single();

  if (!employeeProfile) {
    throw new Error(`Employee profile not found for promoter email: ${promoter.email}`);
  }

  // Check if employer_employee record already exists
  const { data: existing } = await supabaseAdmin
    .from('employer_employees')
    .select('id')
    .eq('employee_id', employeeProfile.id)
    .eq('employer_id', employerProfile.id)
    .single();

  if (existing) {
    return { employerEmployeeId: existing.id, isNew: false };
  }

  // Get company_id from party
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('party_id', promoter.employer_id)
    .maybeSingle();

  // Auto-generate employee code
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const uuidSuffix = employeeProfile.id.replace(/-/g, '').slice(-4).toUpperCase();
  const employeeCode = `EMP-${date}-${uuidSuffix}`;

  // Create employer_employee record
  const { data: newRecord, error: insertError } = await supabaseAdmin
    .from('employer_employees')
    .insert({
      employer_id: employerProfile.id,
      employee_id: employeeProfile.id,
      company_id: company?.id || userProfile.active_company_id || null,
      employment_type: 'full_time',
      employment_status: promoter.status === 'active' ? 'active' : 'inactive',
      employee_code: employeeCode,
      created_by: userId,
      created_at: promoter.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .select('id')
    .single();

  if (insertError || !newRecord) {
    console.error('Error creating employer_employee record:', insertError);
    throw new Error(`Failed to create employer_employee record: ${insertError?.message || 'Unknown error'}`);
  }

  return { employerEmployeeId: newRecord.id, isNew: true };
}

