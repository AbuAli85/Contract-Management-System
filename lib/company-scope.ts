import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Company-scoped query utilities
 * Use these functions to automatically filter queries by the active company
 */

export interface CompanyScope {
  companyId: string | null;
  partyId: string | null;
  userId: string;
}

/**
 * Get company scope from user's active company
 * Returns companyId and partyId for filtering queries
 */
export async function getCompanyScope(): Promise<CompanyScope | null> {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return {
        companyId: null,
        partyId: null,
        userId: user.id,
      };
    }

    // Get company's party_id
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      adminClient = supabase;
    }

    const { data: company } = await adminClient
      .from('companies')
      .select('id, party_id')
      .eq('id', profile.active_company_id)
      .single();

    return {
      companyId: profile.active_company_id,
      partyId: company?.party_id || null,
      userId: user.id,
    };
  } catch (error) {
    console.error('Error getting company scope:', error);
    return null;
  }
}

/**
 * Require company scope - throws if not available
 */
export async function requireCompanyScope(): Promise<CompanyScope> {
  const scope = await getCompanyScope();
  
  if (!scope) {
    throw new Error('Unauthorized');
  }
  
  if (!scope.companyId) {
    throw new Error('No active company selected');
  }
  
  return scope;
}

/**
 * Add company filter to a Supabase query
 * Automatically filters by company_id or party_id based on table structure
 */
export function addCompanyFilter<T>(
  query: any,
  scope: CompanyScope,
  tableName: string
): any {
  if (!scope.companyId && !scope.partyId) {
    // No company selected - return empty result
    return query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Tables that use company_id directly
  const companyIdTables = [
    'company_members',
    'company_settings',
    'company_policies',
  ];

  // Tables that use party_id (from parties table)
  const partyIdTables = [
    'promoters',
    'contracts',
    'parties',
  ];

  // Tables that might have both
  const hybridTables: Record<string, 'company' | 'party' | 'both'> = {
    'employer_employees': 'both', // Can filter by company_id or employer_id (which maps to party)
    'contracts': 'party', // Uses second_party_id which is a party
  };

  if (companyIdTables.includes(tableName)) {
    return query.eq('company_id', scope.companyId);
  }

  if (partyIdTables.includes(tableName)) {
    if (scope.partyId) {
      return query.eq('employer_id', scope.partyId);
    }
    // Fallback: return empty if no party_id
    return query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  if (hybridTables[tableName] === 'both') {
    // Try company_id first, then party_id
    if (scope.companyId) {
      return query.or(`company_id.eq.${scope.companyId},company_id.is.null`);
    }
    if (scope.partyId) {
      // For employer_employees, need to find employer profile first
      // This is handled in the specific API endpoints
      return query;
    }
  }

  if (hybridTables[tableName] === 'party') {
    if (scope.partyId) {
      return query.eq('second_party_id', scope.partyId);
    }
    return query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Default: try to filter by company_id if column exists
  return query.eq('company_id', scope.companyId);
}

/**
 * Helper to get company-scoped query with automatic filtering
 */
export async function getScopedQuery<T>(
  tableName: string,
  select: string = '*'
): Promise<{ query: any; scope: CompanyScope } | null> {
  const scope = await getCompanyScope();
  if (!scope) {
    return null;
  }

  const supabase = await createClient();
  let query = supabase.from(tableName).select(select);

  query = addCompanyFilter(query, scope, tableName);

  return { query, scope };
}

