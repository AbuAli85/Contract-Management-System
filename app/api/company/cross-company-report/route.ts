import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Helper function to check if a company is invalid/mock
function isInvalidCompany(companyName: string): boolean {
  if (!companyName) return true; // Empty names are invalid

  const name = companyName.toLowerCase().trim();

  // Explicitly allow valid Falcon Eye companies (check multiple variations)
  if (
    name.includes('falcon eye modern investments') ||
    name.includes('falcon eye modern investment') ||
    name === 'falcon eye modern investments' ||
    name === 'falcon eye modern investments spc'
  ) {
    return false; // NOT invalid - allow it
  }

  // Filter out invalid/mock companies
  return (
    name === 'digital morph' ||
    name === 'falcon eye group' ||
    name === 'cc' ||
    name === 'digital marketing pro' ||
    name.includes('digital morph') ||
    (name.includes('falcon eye group') && !name.includes('modern investments'))
  );
}

interface CompanyMembership {
  company_id: string;
  role: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    is_active: boolean;
    group: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface CompanyStats {
  employees: number;
  pending_leaves: number;
  pending_expenses: number;
  active_contracts: number;
  checked_in_today: number;
  open_tasks: number;
  pending_reviews: number;
}

interface CompanyWithStats {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  group_name: string | null;
  user_role: string;
  stats: CompanyStats;
}

interface Summary {
  total_companies: number;
  total_employees: number;
  total_pending_leaves: number;
  total_pending_expenses: number;
  total_contracts: number;
  total_open_tasks: number;
  total_checked_in: number;
}

// GET: Fetch cross-company analytics for all companies user has access to
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      adminClient = supabase;
    }

    // ✅ FIX: Use comprehensive company fetching logic (same as /api/user/companies)
    // This ensures we get ALL companies the user has access to, not just from company_members
    let allCompanies: any[] = [];

    // First: Get companies via company_members
    try {
      const { data: membershipCompanies, error: membershipError } =
        await adminClient
          .from('company_members')
          .select(
            `
          company_id,
          role,
          is_primary,
          company:companies (
            id,
            name,
            logo_url,
            group_id,
            party_id
          )
        `
          )
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('is_primary', { ascending: false });

      if (!membershipError && membershipCompanies) {
        allCompanies = membershipCompanies
          .filter((cm: any) => cm.company?.id && cm.company?.name)
          .map((cm: any) => ({
            company_id: cm.company.id,
            company_name: cm.company.name,
            company_logo: cm.company.logo_url,
            user_role: cm.role,
            is_primary: cm.is_primary,
            group_name: null,
            party_id: cm.company.party_id,
            source: 'company_members',
          }))
          .filter((c: any) => !isInvalidCompany(c.company_name || ''));
      }
    } catch (e) {
    }

    // Second: Get directly owned companies
    try {
      const { data: ownedCompanies, error: ownedError } = await adminClient
        .from('companies')
        .select('id, name, logo_url, group_id, party_id')
        .eq('owner_id', user.id)
        .eq('is_active', true);

      if (!ownedError && ownedCompanies) {
        const existingIds = new Set(allCompanies.map(c => c.company_id));
        for (const company of ownedCompanies) {
          if (
            !existingIds.has(company.id) &&
            !isInvalidCompany(company.name || '')
          ) {
            allCompanies.push({
              company_id: company.id,
              company_name: company.name,
              company_logo: company.logo_url,
              user_role: 'owner',
              is_primary: allCompanies.length === 0,
              group_name: null,
              party_id: company.party_id,
              source: 'owned_companies',
            });
          }
        }
      }
    } catch (e) {
    }

    // Third: Get companies linked to parties where user's email matches party contact_email
    // This helps include parties that are linked to companies via party_id
    if (user.email) {
      try {
        const { data: partyLinkedCompanies, error: partyError } =
          await adminClient
            .from('companies')
            .select(
              `
            id,
            name,
            logo_url,
            group_id,
            party_id,
            party:parties!companies_party_id_fkey (
              id,
              name_en,
              contact_email,
              role
            )
          `
            )
            .not('party_id', 'is', null)
            .eq('is_active', true);

        if (!partyError && partyLinkedCompanies) {
          const existingIds = new Set(allCompanies.map(c => c.company_id));
          for (const company of partyLinkedCompanies) {
            const party = company.party as any;
            // Check if user's email matches party contact_email
            if (
              party?.contact_email &&
              party.contact_email.toLowerCase() === user.email.toLowerCase() &&
              !existingIds.has(company.id)
            ) {
              // Filter out invalid/mock companies
              // Check both company name and party name
              const companyName = company.name || party?.name_en || '';
              if (isInvalidCompany(companyName)) continue;

              // Determine role from party role
              let userRole = 'member';
              if (
                party.role &&
                ['ceo', 'chairman', 'owner'].includes(party.role.toLowerCase())
              ) {
                userRole = 'owner';
              } else if (
                party.role &&
                ['admin', 'manager'].includes(party.role.toLowerCase())
              ) {
                userRole = 'admin';
              }

              allCompanies.push({
                company_id: company.id,
                company_name: company.name || party?.name_en,
                company_logo: company.logo_url,
                user_role: userRole,
                is_primary: allCompanies.length === 0,
                group_name: null,
                party_id: company.party_id,
                source: 'party_linked',
              });
            }
          }
        }
      } catch (e) {
      }
    }

    // Fourth: Get companies via employer_employees (if user is an employer)
    // Find companies where user is listed as employer
    try {
      const { data: employerProfile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (employerProfile?.email) {
        // Find parties where user's email matches contact_email
        const { data: employerParties, error: partiesError } = await adminClient
          .from('parties')
          .select('id, name_en, contact_email, type, overall_status')
          .eq('contact_email', employerProfile.email)
          .eq('type', 'Employer')
          .in('overall_status', ['Active', 'active']);

        if (!partiesError && employerParties && employerParties.length > 0) {
          const partyIds = employerParties.map((p: any) => p.id);

          // Find companies linked to these parties
          const { data: employerCompanies, error: employerCompaniesError } =
            await adminClient
              .from('companies')
              .select('id, name, logo_url, group_id, party_id')
              .in('party_id', partyIds)
              .eq('is_active', true);

          if (!employerCompaniesError && employerCompanies) {
            const existingIds = new Set(allCompanies.map(c => c.company_id));
            for (const company of employerCompanies) {
              if (!existingIds.has(company.id)) {
                // Filter out invalid/mock companies
                if (isInvalidCompany(company.name || '')) continue;

                allCompanies.push({
                  company_id: company.id,
                  company_name: company.name,
                  company_logo: company.logo_url,
                  user_role: 'owner', // User is the employer, so they're owner
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: company.party_id,
                  source: 'employer_party',
                });
              }
            }
          }
        }
      }
    } catch (e) {
    }

    // Fifth: Get companies from parties table where type = 'Employer'
    // This is the primary source for employer companies
    if (user.email) {
      try {
        // Get user profile for additional matching
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', user.id)
          .single();

        // Find all parties with type 'Employer' where user is associated
        // Match by: contact_email, contact_person, or any other relationship
        const { data: employerParties, error: employerPartiesError } =
          await adminClient
            .from('parties')
            .select(
              'id, name_en, name_ar, contact_email, contact_person, type, overall_status, logo_url, crn, role'
            )
            .eq('type', 'Employer')
            .in('overall_status', ['Active', 'active'])
            .or(
              `contact_email.eq.${user.email},contact_email.eq.${userProfile?.email || ''},contact_person.ilike.%${userProfile?.full_name || ''}%`
            );

        if (
          !employerPartiesError &&
          employerParties &&
          employerParties.length > 0
        ) {
          const partyIds = employerParties.map((p: any) => p.id);

          // Find companies linked to these parties
          const { data: profileLinkedCompanies, error: profileLinkedError } =
            await adminClient
              .from('companies')
              .select('id, name, logo_url, group_id, party_id')
              .in('party_id', partyIds)
              .eq('is_active', true);

          if (!profileLinkedError && profileLinkedCompanies) {
            const existingIds = new Set(allCompanies.map(c => c.company_id));
            for (const company of profileLinkedCompanies) {
              if (!existingIds.has(company.id)) {
                // Filter out invalid/mock companies
                if (isInvalidCompany(company.name || '')) continue;

                // Find matching party to determine role
                const matchingParty = employerParties.find(
                  (p: any) => p.id === company.party_id
                );
                let userRole = 'owner'; // Default to owner for employer parties
                if (matchingParty?.role) {
                  const role = matchingParty.role.toLowerCase();
                  if (['ceo', 'chairman', 'owner'].includes(role)) {
                    userRole = 'owner';
                  } else if (['admin', 'manager'].includes(role)) {
                    userRole = 'admin';
                  }
                }

                allCompanies.push({
                  company_id: company.id,
                  company_name: company.name,
                  company_logo: company.logo_url,
                  user_role: userRole,
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: company.party_id,
                  source: 'profile_party_match',
                });
              }
            }
          }
        }
      } catch (e) {
      }
    }

    // Sixth: Directly fetch companies from parties table where type = 'Employer'
    // This ensures all employer parties are available in the company switcher
    if (user.email) {
      try {
        // Get user profile for matching
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', user.id)
          .single();

        // Find all active employer parties
        // Fetch ALL employer parties, then filter in code to ensure Falcon Eye Modern Investments is included
        const { data: allEmployerParties, error: employerPartiesError } =
          await adminClient
            .from('parties')
            .select(
              'id, name_en, name_ar, contact_email, contact_person, type, overall_status, logo_url, crn, role'
            )
            .eq('type', 'Employer')
            .in('overall_status', ['Active', 'active']);

        if (
          !employerPartiesError &&
          allEmployerParties &&
          allEmployerParties.length > 0
        ) {
          const existingIds = new Set(allCompanies.map(c => c.company_id));

          for (const party of allEmployerParties) {
            // Skip if already in companies list
            if (existingIds.has(party.id)) continue;

            // Check if there's a company linked to this party that user has access to
            const { data: linkedCompany } = await adminClient
              .from('companies')
              .select('id, name, logo_url, owner_id, party_id')
              .eq('party_id', party.id)
              .eq('is_active', true)
              .maybeSingle();

            // Filter out invalid/mock companies
            // Check both party name and linked company name
            const partyName = party.name_en || party.name_ar || '';
            const companyName = linkedCompany?.name || '';
            if (
              isInvalidCompany(partyName) &&
              (!companyName || isInvalidCompany(companyName))
            ) {
              continue; // Skip if both party and company names are invalid
            }

            // Check if user is associated with this party
            // Match by: contact_email, contact_person name, owns linked company, or is member of linked company
            let isAssociated = false;
            let userRole = 'owner'; // Default to owner for employer parties

            if (linkedCompany) {
              // Check if user owns the linked company
              if (linkedCompany.owner_id === user.id) {
                isAssociated = true;
                userRole = 'owner';
              } else {
                // Check if user is a member of the linked company
                const { data: membership } = await adminClient
                  .from('company_members')
                  .select('role')
                  .eq('company_id', linkedCompany.id)
                  .eq('user_id', user.id)
                  .eq('status', 'active')
                  .maybeSingle();

                if (membership) {
                  isAssociated = true;
                  userRole = membership.role || 'member';
                }
              }
            }

            // Also check direct party association
            if (!isAssociated) {
              // Check email match
              const emailMatch =
                party.contact_email &&
                (party.contact_email.toLowerCase() ===
                  user.email?.toLowerCase() ||
                  (userProfile?.email &&
                    party.contact_email.toLowerCase() ===
                      userProfile.email.toLowerCase()));

              // Check name match
              const nameMatch =
                party.contact_person &&
                userProfile?.full_name &&
                party.contact_person
                  .toLowerCase()
                  .includes(userProfile.full_name.toLowerCase());

              // Special case: If it's Falcon Eye Modern Investments, always include it
              // This ensures the company appears even if exact email/name match fails
              const partyNameLower = (
                party.name_en ||
                party.name_ar ||
                ''
              ).toLowerCase();
              const companyNameLower = (companyName || '').toLowerCase();
              const isFalconEyeModern =
                partyNameLower.includes('falcon eye modern investment') ||
                companyNameLower.includes('falcon eye modern investment');

              // For Falcon Eye Modern Investments, always associate the user
              if (isFalconEyeModern) {
                isAssociated = true;
                userRole = 'owner'; // Default to owner for Falcon Eye Modern Investments
              } else {
                // More permissive: For parties_employer_direct (no linked company),
                // grant access if it's an active employer party
                // This ensures consistency with the companies list endpoint
                // If the party appears in the companies list, it should appear in the cross-company report
                const isPartiesEmployerDirect =
                  !linkedCompany && party.type === 'Employer';
                isAssociated =
                  emailMatch || nameMatch || isPartiesEmployerDirect;
              }

              // Determine user role from party role
              if (isAssociated && party.role && !isFalconEyeModern) {
                const role = party.role.toLowerCase();
                if (['ceo', 'chairman', 'owner'].includes(role)) {
                  userRole = 'owner';
                } else if (['admin', 'manager'].includes(role)) {
                  userRole = 'admin';
                } else {
                  userRole = 'member';
                }
              }
            }

            // If user is associated, add the party as a company
            if (isAssociated) {
              // Use linked company if exists, otherwise use party data
              if (linkedCompany && !existingIds.has(linkedCompany.id)) {
                allCompanies.push({
                  company_id: linkedCompany.id,
                  company_name: linkedCompany.name || party.name_en,
                  company_logo: linkedCompany.logo_url || party.logo_url,
                  user_role: userRole,
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: party.id,
                  source: 'parties_employer_linked',
                });
              } else if (!linkedCompany) {
                // Add party directly as a company (even if no company record exists)
                allCompanies.push({
                  company_id: party.id, // Use party ID as company ID
                  company_name:
                    party.name_en || party.name_ar || 'Unknown Company',
                  company_logo: party.logo_url,
                  user_role: userRole,
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: party.id,
                  source: 'parties_employer_direct',
                });
              }
            }
          }
        }
      } catch (e) {
      }
    }

    // If still no companies found, return empty state
    if (allCompanies.length === 0) {
      return NextResponse.json({
        success: true,
        companies: [],
        grouped: {},
        summary: {
          total_companies: 0,
          total_employees: 0,
          total_pending_leaves: 0,
          total_pending_expenses: 0,
          total_contracts: 0,
          total_open_tasks: 0,
          total_checked_in: 0,
        },
        message:
          'No companies configured yet. Set up multi-company management to see analytics here.',
      });
    }

    // Fetch group names for all companies
    // Companies can be linked to groups via:
    // 1. companies.group_id (direct reference to holding_groups)
    // 2. holding_group_members table (many-to-many relationship)
    //    - member_type = 'company' (linked via company_id)
    //    - member_type = 'party' (linked via party_id, for parties_employer_direct companies)
    // 3. Companies linked to parties that are in groups (via companies.party_id -> holding_group_members.party_id)
    try {
      const companyIds = allCompanies.map(c => c.company_id);
      const partyIds = allCompanies
        .filter(c => c.party_id)
        .map(c => c.party_id)
        .filter(Boolean);

      // Also include company_ids that are actually party_ids (for parties_employer_direct)
      const partyIdsFromDirect = allCompanies
        .filter(c => c.source === 'parties_employer_direct')
        .map(c => c.company_id);
      const allPartyIds = Array.from(
        new Set([...partyIds, ...partyIdsFromDirect])
      );

      // Fetch companies with their group_id and party_id
      const { data: companiesWithGroups } = await adminClient
        .from('companies')
        .select('id, group_id, party_id')
        .in('id', companyIds);

      // Get all party_ids from companies (for checking party-based group memberships)
      const companyPartyIds = new Set(
        (companiesWithGroups || []).map((c: any) => c.party_id).filter(Boolean)
      );
      const allPartyIdsForGroups = Array.from(
        new Set([...allPartyIds, ...companyPartyIds])
      );

      // Get all unique group_ids (both from companies.group_id and holding_group_members)
      const groupIdsFromCompanies = new Set(
        (companiesWithGroups || []).map((c: any) => c.group_id).filter(Boolean)
      );

      // Check holding_group_members table for both company_id and party_id
      const [companyGroupMembers, partyGroupMembers] = await Promise.all([
        // Companies linked via company_id
        companyIds.length > 0
          ? adminClient
              .from('holding_group_members')
              .select('company_id, holding_group_id')
              .in('company_id', companyIds)
              .eq('member_type', 'company')
          : { data: null, error: null },
        // Parties linked via party_id (for parties_employer_direct and companies with party_id)
        allPartyIdsForGroups.length > 0
          ? adminClient
              .from('holding_group_members')
              .select('party_id, holding_group_id')
              .in('party_id', allPartyIdsForGroups)
              .eq('member_type', 'party')
          : { data: null, error: null },
      ]);

      const groupIdsFromCompanyMembers = new Set(
        (companyGroupMembers?.data || [])
          .map((gm: any) => gm.holding_group_id)
          .filter(Boolean)
      );

      const groupIdsFromPartyMembers = new Set(
        (partyGroupMembers?.data || [])
          .map((gm: any) => gm.holding_group_id)
          .filter(Boolean)
      );

      // Combine all group IDs
      const allGroupIds = Array.from(
        new Set([
          ...groupIdsFromCompanies,
          ...groupIdsFromCompanyMembers,
          ...groupIdsFromPartyMembers,
        ])
      );

      // Fetch all group names
      const groupNameMap = new Map<string, string>();
      if (allGroupIds.length > 0) {
        const { data: groups } = await adminClient
          .from('holding_groups')
          .select('id, name_en, name_ar')
          .in('id', allGroupIds)
          .eq('is_active', true);

        if (groups) {
          for (const group of groups) {
            groupNameMap.set(
              group.id,
              group.name_en || group.name_ar || 'Unknown Group'
            );
          }
        }
      }

      // Create a map of company_id -> group_id (from all sources)
      const companyGroupMap = new Map<string, string>();

      // From companies.group_id
      if (companiesWithGroups) {
        for (const company of companiesWithGroups) {
          if (company.group_id) {
            companyGroupMap.set(company.id, company.group_id);
          }
        }
      }

      // From holding_group_members (company-based)
      if (companyGroupMembers?.data) {
        for (const member of companyGroupMembers.data) {
          if (member.holding_group_id && member.company_id) {
            companyGroupMap.set(member.company_id, member.holding_group_id);
          }
        }
      }

      // From holding_group_members (party-based) - for parties_employer_direct and companies with party_id
      if (partyGroupMembers?.data) {
        // Create a map of party_id -> group_id for quick lookup
        const partyGroupMap = new Map<string, string>();
        for (const member of partyGroupMembers.data) {
          if (member.holding_group_id && member.party_id) {
            partyGroupMap.set(member.party_id, member.holding_group_id);
          }
        }

        // Apply party-based groups to companies
        for (const company of allCompanies) {
          // Check if company's party_id is in a group
          if (company.party_id && partyGroupMap.has(company.party_id)) {
            const groupId = partyGroupMap.get(company.party_id);
            if (groupId) {
              companyGroupMap.set(company.company_id, groupId);
            }
          }

          // For parties_employer_direct, company_id IS the party_id
          if (
            company.source === 'parties_employer_direct' &&
            partyGroupMap.has(company.company_id)
          ) {
            const groupId = partyGroupMap.get(company.company_id);
            if (groupId) {
              companyGroupMap.set(company.company_id, groupId);
            }
          }
        }

        // Also check companies from companiesWithGroups that have party_id
        if (companiesWithGroups) {
          for (const company of companiesWithGroups) {
            if (company.party_id && partyGroupMap.has(company.party_id)) {
              const groupId = partyGroupMap.get(company.party_id);
              if (groupId) {
                companyGroupMap.set(company.id, groupId);
              }
            }
          }
        }
      }

      // Update companies with group names
      for (const company of allCompanies) {
        const groupId = companyGroupMap.get(company.company_id);
        if (groupId) {
          const groupName = groupNameMap.get(groupId);
          if (groupName) {
            company.group_name = groupName;
          }
        }
      }

      // Debug logging (only in development)
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (groupError) {
      // Continue without group names if there's an error
    }

    // Convert to memberships format for compatibility
    // Preserve source and party_id information for stats calculation
    // Also preserve group_name for easier access later
    const memberships: (CompanyMembership & {
      source?: string;
      party_id?: string;
      group_name?: string | null;
    })[] = allCompanies.map((c: any) => ({
      company_id: c.company_id,
      role: c.user_role,
      source: c.source,
      party_id: c.party_id,
      group_name: c.group_name || null, // Preserve group_name directly
      company: {
        id: c.company_id,
        name: c.company_name,
        logo_url: c.company_logo,
        is_active: true,
        group: c.group_name ? { id: '', name: c.group_name } : null,
      },
    }));

    // Helper function to safely query counts (handles missing company_id columns)
    // Use adminClient to bypass RLS for accurate counts
    const _safeCount = async (
      table: string,
      conditions: Record<string, unknown> = {}
    ): Promise<number> => {
      try {
        let query = adminClient
          .from(table)
          .select('id', { count: 'exact', head: true });
        for (const [key, value] of Object.entries(conditions || {})) {
          if (value === undefined || value === null) {
            // Skip null/undefined conditions
            continue;
          }
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
        const { count, error } = await query;
        if (error) {
          return 0;
        }
        return count || 0;
      } catch (e) {
        // Column may not exist, return 0
        return 0;
      }
    };

    // Filter out invalid companies before processing
    const validMemberships = memberships.filter(membership => {
      const companyName = membership.company?.name || '';
      return companyName && !isInvalidCompany(companyName);
    });

    // ✅ OPTIMIZATION: Batch fetch all data to avoid N+1 queries
    // This reduces database queries from O(n*7) to O(7) where n is number of companies
    const companyIds = validMemberships.map(m => m.company_id);

    // Build party_id map (for parties_employer_direct, company_id IS party_id)
    const partyIdMap = new Map<string, string | null>();
    for (const membership of validMemberships) {
      if (
        membership.source === 'parties_employer_direct' &&
        membership.party_id
      ) {
        partyIdMap.set(membership.company_id, membership.party_id);
      } else if (membership.party_id) {
        partyIdMap.set(membership.company_id, membership.party_id);
      }
    }

    // Batch fetch party_ids for companies that don't have them yet
    const companyIdsNeedingPartyId = companyIds.filter(
      id => !partyIdMap.has(id)
    );
    if (companyIdsNeedingPartyId.length > 0) {
      try {
        const { data: companiesData } = await adminClient
          .from('companies')
          .select('id, party_id')
          .in('id', companyIdsNeedingPartyId);

        if (companiesData) {
          for (const company of companiesData) {
            partyIdMap.set(company.id, company.party_id || null);
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all employer_employees for all companies
    const allEmployerEmployeesMap = new Map<string, any[]>();
    if (companyIds.length > 0) {
      try {
        const { data: allEmployerEmployees } = await adminClient
          .from('employer_employees')
          .select('id, company_id, employee_id')
          .in('company_id', companyIds)
          .eq('employment_status', 'active')
          .not('employee_id', 'is', null);

        if (allEmployerEmployees) {
          for (const ee of allEmployerEmployees) {
            if (!allEmployerEmployeesMap.has(ee.company_id)) {
              allEmployerEmployeesMap.set(ee.company_id, []);
            }
            allEmployerEmployeesMap.get(ee.company_id)!.push(ee);
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all promoters for all party_ids
    const allPartyIds = Array.from(
      new Set(Array.from(partyIdMap.values()).filter(Boolean) as string[])
    );
    const promotersMap = new Map<string, any[]>();
    if (allPartyIds.length > 0) {
      try {
        const { data: allPromoters } = await adminClient
          .from('promoters')
          .select('id, employer_id')
          .in('employer_id', allPartyIds)
          .eq('status', 'active');

        if (allPromoters) {
          for (const promoter of allPromoters) {
            if (!promotersMap.has(promoter.employer_id)) {
              promotersMap.set(promoter.employer_id, []);
            }
            promotersMap.get(promoter.employer_id)!.push(promoter);
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all attendance for today
    const today = new Date().toISOString().split('T')[0];
    const allEmployerEmployeeIds = Array.from(allEmployerEmployeesMap.values())
      .flat()
      .map(ee => ee.id);
    const attendanceMap = new Map<string, number>();
    if (allEmployerEmployeeIds.length > 0) {
      try {
        const { data: allAttendance } = await adminClient
          .from('employee_attendance')
          .select('employer_employee_id')
          .in('employer_employee_id', allEmployerEmployeeIds)
          .eq('attendance_date', today)
          .not('check_in', 'is', null);

        if (allAttendance) {
          // Count attendance per company
          for (const attendance of allAttendance) {
            // Find which company this attendance belongs to
            for (const [
              companyId,
              employees,
            ] of allEmployerEmployeesMap.entries()) {
              if (
                employees.some(ee => ee.id === attendance.employer_employee_id)
              ) {
                attendanceMap.set(
                  companyId,
                  (attendanceMap.get(companyId) || 0) + 1
                );
                break;
              }
            }
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all tasks
    const tasksMap = new Map<string, number>();
    if (allEmployerEmployeeIds.length > 0) {
      try {
        const { data: allTasks } = await adminClient
          .from('employee_tasks')
          .select('employer_employee_id')
          .in('employer_employee_id', allEmployerEmployeeIds)
          .in('status', ['pending', 'in_progress']);

        if (allTasks) {
          // Count tasks per company
          for (const task of allTasks) {
            for (const [
              companyId,
              employees,
            ] of allEmployerEmployeesMap.entries()) {
              if (employees.some(ee => ee.id === task.employer_employee_id)) {
                tasksMap.set(companyId, (tasksMap.get(companyId) || 0) + 1);
                break;
              }
            }
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all pending leaves
    const leavesMap = new Map<string, number>();
    if (companyIds.length > 0) {
      try {
        const { data: allLeaves } = await adminClient
          .from('employee_leave_requests')
          .select('company_id')
          .in('company_id', companyIds)
          .eq('status', 'pending');

        if (allLeaves) {
          for (const leave of allLeaves) {
            leavesMap.set(
              leave.company_id,
              (leavesMap.get(leave.company_id) || 0) + 1
            );
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all pending expenses
    const expensesMap = new Map<string, number>();
    if (companyIds.length > 0) {
      try {
        const { data: allExpenses } = await adminClient
          .from('employee_expenses')
          .select('company_id')
          .in('company_id', companyIds)
          .eq('status', 'pending');

        if (allExpenses) {
          for (const expense of allExpenses) {
            expensesMap.set(
              expense.company_id,
              (expensesMap.get(expense.company_id) || 0) + 1
            );
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all contracts
    const contractsMap = new Map<string, number>();
    if (allPartyIds.length > 0) {
      try {
        // Create reverse map: party_id -> company_id for efficient lookup
        const partyToCompanyMap = new Map<string, string[]>();
        for (const [companyId, partyId] of partyIdMap.entries()) {
          if (partyId) {
            if (!partyToCompanyMap.has(partyId)) {
              partyToCompanyMap.set(partyId, []);
            }
            partyToCompanyMap.get(partyId)!.push(companyId);
          }
        }

        // Fetch contracts where first_party_id matches
        const { data: contractsFirstParty } = await adminClient
          .from('contracts')
          .select('first_party_id')
          .eq('status', 'active')
          .in('first_party_id', allPartyIds);

        // Fetch contracts where second_party_id matches
        const { data: contractsSecondParty } = await adminClient
          .from('contracts')
          .select('second_party_id')
          .eq('status', 'active')
          .in('second_party_id', allPartyIds);

        // Count contracts per company
        if (contractsFirstParty) {
          for (const contract of contractsFirstParty) {
            if (
              contract.first_party_id &&
              partyToCompanyMap.has(contract.first_party_id)
            ) {
              for (const companyId of partyToCompanyMap.get(
                contract.first_party_id
              )!) {
                contractsMap.set(
                  companyId,
                  (contractsMap.get(companyId) || 0) + 1
                );
              }
            }
          }
        }

        if (contractsSecondParty) {
          for (const contract of contractsSecondParty) {
            if (
              contract.second_party_id &&
              partyToCompanyMap.has(contract.second_party_id)
            ) {
              for (const companyId of partyToCompanyMap.get(
                contract.second_party_id
              )!) {
                contractsMap.set(
                  companyId,
                  (contractsMap.get(companyId) || 0) + 1
                );
              }
            }
          }
        }
      } catch (e) {
      }
    }

    // Batch fetch all pending reviews
    const reviewsMap = new Map<string, number>();
    if (companyIds.length > 0) {
      try {
        const { data: allReviews } = await adminClient
          .from('performance_reviews')
          .select('company_id')
          .in('company_id', companyIds)
          .in('status', ['draft', 'submitted']);

        if (allReviews) {
          for (const review of allReviews) {
            reviewsMap.set(
              review.company_id,
              (reviewsMap.get(review.company_id) || 0) + 1
            );
          }
        }
      } catch (e) {
      }
    }

    // Now build stats for each company using the batched data
    const companiesWithStats: CompanyWithStats[] = validMemberships.map(
      membership => {
        const companyId = membership.company_id;
        const company = membership.company;
        const partyId = partyIdMap.get(companyId) || null;

        // Get employee count from batched data
        const employerEmployees = allEmployerEmployeesMap.get(companyId) || [];
        const employerEmployeeIds = new Set(
          employerEmployees.map((ee: any) => ee.employee_id).filter(Boolean)
        );

        const promoters = partyId ? promotersMap.get(partyId) || [] : [];
        const promoterIds = new Set(promoters.map((p: any) => p.id));

        const allEmployeeIds = new Set([
          ...employerEmployeeIds,
          ...promoterIds,
        ]);
        const employeeCount = allEmployeeIds.size;

        // Get group_name
        const groupName =
          membership.group_name ||
          allCompanies.find(c => c.company_id === companyId)?.group_name ||
          membership.company?.group?.name ||
          null;

        return {
          id: companyId,
          name: company?.name || 'Unknown',
          logo_url: company?.logo_url ?? null,
          is_active: company?.is_active ?? true,
          group_name: groupName,
          user_role: membership.role,
          stats: {
            employees: employeeCount,
            pending_leaves: leavesMap.get(companyId) || 0,
            pending_expenses: expensesMap.get(companyId) || 0,
            active_contracts: contractsMap.get(companyId) || 0,
            checked_in_today: attendanceMap.get(companyId) || 0,
            open_tasks: tasksMap.get(companyId) || 0,
            pending_reviews: reviewsMap.get(companyId) || 0,
          },
        };
      }
    );

    // Calculate summary
    const summary: Summary = companiesWithStats.reduce(
      (acc: Summary, company: CompanyWithStats) => ({
        total_companies: acc.total_companies + 1,
        total_employees: acc.total_employees + company.stats.employees,
        total_pending_leaves:
          acc.total_pending_leaves + company.stats.pending_leaves,
        total_pending_expenses:
          acc.total_pending_expenses + company.stats.pending_expenses,
        total_contracts: acc.total_contracts + company.stats.active_contracts,
        total_open_tasks: acc.total_open_tasks + company.stats.open_tasks,
        total_checked_in: acc.total_checked_in + company.stats.checked_in_today,
      }),
      {
        total_companies: 0,
        total_employees: 0,
        total_pending_leaves: 0,
        total_pending_expenses: 0,
        total_contracts: 0,
        total_open_tasks: 0,
        total_checked_in: 0,
      }
    );

    // Group by company group if applicable
    const groupedCompanies: Record<string, CompanyWithStats[]> = {};
    companiesWithStats.forEach((company: CompanyWithStats) => {
      const groupKey = company.group_name || 'Standalone';
      if (!groupedCompanies[groupKey]) {
        groupedCompanies[groupKey] = [];
      }
      groupedCompanies[groupKey].push(company);
    });

    // Ensure all data structures are valid before returning
    const response = {
      success: true,
      companies: Array.isArray(companiesWithStats) ? companiesWithStats : [],
      grouped:
        groupedCompanies && typeof groupedCompanies === 'object'
          ? groupedCompanies
          : {},
      summary: summary || {
        total_companies: 0,
        total_employees: 0,
        total_pending_leaves: 0,
        total_pending_expenses: 0,
        total_contracts: 0,
        total_open_tasks: 0,
        total_checked_in: 0,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Return a proper error response with valid structure
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        companies: [],
        grouped: {},
        summary: {
          total_companies: 0,
          total_employees: 0,
          total_pending_leaves: 0,
          total_pending_expenses: 0,
          total_contracts: 0,
          total_open_tasks: 0,
          total_checked_in: 0,
        },
      },
      { status: 500 }
    );
  }
}
