import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { retrySupabaseOperation } from '@/lib/auth/retry';
import {
  extractCorrelationId,
  generateCorrelationId,
  logWithCorrelation,
  withCorrelationId,
} from '@/lib/utils/correlation';

export const dynamic = 'force-dynamic';

// Helper function to check if a company is invalid/mock
function isInvalidCompany(companyName: string): boolean {
  const name = companyName.toLowerCase().trim();

  // Explicitly allow valid Falcon Eye companies
  if (name.includes('falcon eye modern investments')) {
    return false;
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

// GET: Fetch all companies the user can access (under their profile).
// Returns: company_members, owned companies, party-linked, employer parties, and user_roles.
export async function GET(request: NextRequest) {
  // Extract or generate correlation ID
  const correlationId =
    extractCorrelationId(request.headers) || generateCorrelationId();

  try {
    // CRITICAL: Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logWithCorrelation(
        correlationId,
        'error',
        'Missing environment variables',
        {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
        }
      );

      return NextResponse.json(
        {
          error: 'Configuration Error',
          message:
            'Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your hosting platform (Vercel) and redeploy.',
          details: {
            missingVariables: [
              !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
              !supabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            ].filter(Boolean),
            isProduction:
              process.env.NODE_ENV === 'production' || !!process.env.VERCEL_ENV,
            diagnosticEndpoint: '/api/diagnostics/env-check',
            correlationId,
          },
        },
        {
          status: 500,
          headers: withCorrelationId({}, correlationId),
        }
      );
    }

    // Debug: Log all cookies to diagnose cookie naming issue
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(
      c =>
        c.name.includes('sb-') ||
        c.name.includes('auth-token') ||
        c.name.includes('supabase')
    );
    logWithCorrelation(correlationId, 'debug', 'Cookie check', {
      allCookies: allCookies.map(c => c.name),
      supabaseCookies: supabaseCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
    });

    // Extract project reference from Supabase URL (already checked above)
    const projectRef = supabaseUrl.match(
      /https?:\/\/([^.]+)\.supabase\.co/
    )?.[1];
    logWithCorrelation(correlationId, 'debug', 'Expected cookie prefix', {
      prefix: projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token',
    });

    const supabase = await createClient();

    // Try getUser() with retry logic (most reliable)
    let user = null;
    let authError = null;

    try {
      const authResult = await retrySupabaseOperation(
        () => supabase.auth.getUser(),
        {
          maxRetries: 2,
          initialDelayMs: 50,
          onRetry: (attempt, error) => {
            logWithCorrelation(
              correlationId,
              'warn',
              `getUser() retry ${attempt}`,
              {
                error: error.message,
              }
            );
          },
        }
      );

      user = authResult.data?.user || null;
      authError = authResult.error;
    } catch (e: any) {
      authError = e;
      logWithCorrelation(correlationId, 'error', 'Exception getting user', {
        error: e.message || String(e),
      });
    }

    // Fallback: Try getSession() if getUser() fails
    if (!user && authError) {
      logWithCorrelation(
        correlationId,
        'debug',
        'getUser() failed, trying getSession() as fallback'
      );
      try {
        const sessionResult = await retrySupabaseOperation(
          () => supabase.auth.getSession(),
          {
            maxRetries: 2,
            initialDelayMs: 50,
            onRetry: (attempt, error) => {
              logWithCorrelation(
                correlationId,
                'warn',
                `getSession() retry ${attempt}`,
                {
                  error: error.message,
                }
              );
            },
          }
        );

        if (sessionResult.data?.session?.user) {
          user = sessionResult.data.session.user;
          authError = null;
          logWithCorrelation(
            correlationId,
            'info',
            'Fallback getSession() succeeded'
          );
        }
      } catch (sessionError: any) {
        logWithCorrelation(correlationId, 'error', 'getSession() also failed', {
          error: sessionError.message || String(sessionError),
        });
      }
    }

    if (authError || !user) {
      const errorDetails = {
        authError: authError?.message || 'No user found',
        hasCookies: allCookies.length > 0,
        cookieNames: allCookies.map(c => c.name),
        supabaseCookies: supabaseCookies.map(c => c.name),
        expectedCookiePrefix: projectRef
          ? `sb-${projectRef}-auth-token`
          : 'sb-auth-token',
        correlationId,
      };

      logWithCorrelation(
        correlationId,
        'error',
        'Authentication failed',
        errorDetails
      );

      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Please sign in to access your companies',
          details: authError?.message || 'No active session found',
          troubleshooting: {
            suggestion:
              'Your session may have expired. Please refresh the page or sign in again.',
            cookieIssue:
              supabaseCookies.length === 0
                ? 'No Supabase cookies found. This may indicate a session issue.'
                : undefined,
          },
          correlationId,
        },
        {
          status: 401,
          headers: withCorrelationId({}, correlationId),
        }
      );
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      adminClient = supabase;
    }

    const minimal =
      request.nextUrl?.searchParams?.get('minimal') === '1' ||
      request.nextUrl?.searchParams?.get('minimal') === 'true';

    // Fast path for ?minimal=1: only batched queries, no per-row work (avoids timeout when many employer parties exist)
    if (minimal) {
      const fastCompanies: any[] = [];

      const [membershipRes, ownedRes, profileRes] = await Promise.all([
        adminClient
          .from('company_members')
          .select('company_id, role, is_primary, company:companies(id, name, logo_url)')
          .eq('user_id', user.id)
          .in('status', ['active', 'invited']),
        adminClient
          .from('companies')
          .select('id, name, logo_url, party_id')
          .eq('owner_id', user.id),
        adminClient
          .from('profiles')
          .select('active_company_id')
          .eq('id', user.id)
          .single(),
      ]);

      const membershipData = membershipRes.data || [];
      const ownedData = ownedRes.data || [];
      const existingIds = new Set<string>();

      for (const cm of membershipData as any[]) {
        const company = cm.company;
        if (company?.id && company?.name && !isInvalidCompany(company.name) && !existingIds.has(company.id)) {
          existingIds.add(company.id);
          fastCompanies.push({
            company_id: company.id,
            company_name: company.name,
            company_logo: company.logo_url ?? null,
            user_role: cm.role || 'member',
            is_primary: !!cm.is_primary,
            group_name: null,
          });
        }
      }
      // If join returned null for some rows, batch-fetch those companies
      const orphanIds = (membershipData as any[])
        .map((cm: any) => cm.company_id)
        .filter((id: string) => id && !existingIds.has(id));
      if (orphanIds.length > 0) {
        const { data: orphanCompanies } = await adminClient
          .from('companies')
          .select('id, name, logo_url')
          .in('id', orphanIds);
        const byId = new Map((orphanCompanies || []).map((c: any) => [c.id, c]));
        for (const cm of membershipData as any[]) {
          const id = cm.company_id;
          if (!id || existingIds.has(id)) continue;
          const company = byId.get(id);
          if (!company?.name || isInvalidCompany(company.name)) continue;
          existingIds.add(id);
          fastCompanies.push({
            company_id: id,
            company_name: company.name,
            company_logo: company.logo_url ?? null,
            user_role: cm.role || 'member',
            is_primary: !!cm.is_primary,
            group_name: null,
          });
        }
      }
      for (const c of ownedData as any[]) {
        if (!c?.id || !c?.name || isInvalidCompany(c.name) || existingIds.has(c.id)) continue;
        existingIds.add(c.id);
        fastCompanies.push({
          company_id: c.id,
          company_name: c.name,
          company_logo: c.logo_url ?? null,
          user_role: 'owner',
          is_primary: fastCompanies.length === 0,
          group_name: null,
        });
      }

      const { data: roleRows } = await adminClient
        .from('user_roles')
        .select('company_id, role')
        .eq('user_id', user.id);
      const roleRowsWithCompany = (roleRows || []).filter((r: any) => r?.company_id);
      if (roleRowsWithCompany.length > 0) {
        const ids = [...new Set(roleRowsWithCompany.map((r: any) => r.company_id).filter(Boolean))];
        const { data: companiesFromRoles } = await adminClient
          .from('companies')
          .select('id, name, logo_url')
          .in('id', ids);
        for (const c of companiesFromRoles || []) {
          if (!c?.id || !c?.name || isInvalidCompany(c.name) || existingIds.has(c.id)) continue;
          existingIds.add(c.id);
          const roleRow = roleRowsWithCompany.find((r: any) => r.company_id === c.id);
          fastCompanies.push({
            company_id: c.id,
            company_name: c.name,
            company_logo: c.logo_url ?? null,
            user_role: roleRow?.role || 'member',
            is_primary: false,
            group_name: null,
          });
        }
      }

      const { data: promoterEmployers } = await adminClient
        .from('promoters')
        .select('employer_id')
        .not('employer_id', 'is', null)
        .eq('created_by', user.id);
      const employerPartyIds = [...new Set((promoterEmployers || []).map((p: any) => p.employer_id).filter(Boolean))];
      if (employerPartyIds.length > 0) {
        const { data: parties } = await adminClient
          .from('parties')
          .select('id, name_en, name_ar, logo_url')
          .in('id', employerPartyIds)
          .eq('type', 'Employer');
        for (const party of parties || []) {
          if (!party?.id || existingIds.has(party.id)) continue;
          const name = party.name_en || party.name_ar || 'Unknown Company';
          if (isInvalidCompany(name)) continue;
          existingIds.add(party.id);
          fastCompanies.push({
            company_id: party.id,
            company_name: name,
            company_logo: party.logo_url ?? null,
            user_role: 'member',
            is_primary: false,
            group_name: null,
          });
        }
      }

      let activeCompanyId = profileRes.data?.active_company_id ?? null;
      if (!activeCompanyId && fastCompanies.length > 0) {
        activeCompanyId = fastCompanies[0].company_id;
        await adminClient
          .from('profiles')
          .update({ active_company_id: activeCompanyId })
          .eq('id', user.id);
      }

      const minimalList = fastCompanies.map((c: any) => ({
        company_id: c.company_id,
        company_name: c.company_name,
        company_logo: c.company_logo ?? null,
        user_role: c.user_role || 'member',
        is_primary: c.company_id === activeCompanyId,
        group_name: null,
      }));

      return NextResponse.json(
        {
          success: true,
          companies: minimalList,
          active_company_id: activeCompanyId,
          correlationId,
        },
        { headers: withCorrelationId({}, correlationId) }
      );
    }

    let allCompanies: any[] = [];
    let membershipCompanies: any[] = []; // Track for logging

    // First try: Get companies via company_members using admin client
    // Include both active and invited status to catch all memberships
    const { data: membershipData, error: membershipError } = await adminClient
      .from('company_members')
      .select(
        `
        company_id,
        role,
        is_primary,
        status,
        company:companies (
          id,
          name,
          logo_url,
          group_id,
          is_active
        )
      `
      )
      .eq('user_id', user.id)
      .in('status', ['active', 'invited']) // Include both active and invited
      .order('is_primary', { ascending: false });

    if (!membershipError && membershipData) {
      membershipCompanies = membershipData; // Store for logging
      // First, identify any orphaned memberships (company_id exists but company record doesn't)
      const orphanedMemberships = membershipData.filter(
        (cm: any) => !cm.company?.id || !cm.company?.name
      );

      if (orphanedMemberships.length > 0) {

        // Try to fetch company data directly for orphaned memberships
        const orphanedCompanyIds = orphanedMemberships
          .map((cm: any) => cm.company_id)
          .filter(Boolean);
        if (orphanedCompanyIds.length > 0) {
          const { data: orphanedCompanies } = await adminClient
            .from('companies')
            .select('id, name, logo_url, group_id, is_active')
            .in('id', orphanedCompanyIds);

          // Create a map for quick lookup
          const orphanedCompanyMap = new Map(
            (orphanedCompanies || []).map((c: any) => [c.id, c])
          );

          // Update membershipCompanies with found company data
          for (const cm of orphanedMemberships) {
            const foundCompany = orphanedCompanyMap.get(cm.company_id);
            if (foundCompany) {
              cm.company = foundCompany;
            }
          }
        }
      }

      allCompanies = membershipData
        .filter((cm: any) => {
          // Include companies even if is_active is false (user might need to see them)
          // Only filter if company record doesn't exist at all (even after orphaned check)
          if (!cm.company?.id || !cm.company?.name) {
            return false;
          }
          // Don't filter by is_active - include all companies user is a member of
          return true;
        })
        .map((cm: any) => ({
          company_id: cm.company.id,
          company_name: cm.company.name,
          company_logo: cm.company.logo_url,
          user_role: cm.role,
          is_primary: cm.is_primary,
          group_name: null, // Will fetch group names separately if needed
          source: 'company_members',
          membership_status: cm.status, // Track membership status
        }))
        // Filter out invalid/mock companies
        .filter((c: any) => {
          const isValid = !isInvalidCompany(c.company_name || '');
          if (!isValid) {
          }
          return isValid;
        });
    }

    // Second try: Also check if user owns any companies directly (in case company_members is missing)
    // Include inactive companies too - owner should see all their companies
    const { data: ownedCompanies, error: ownedError } = await adminClient
      .from('companies')
      .select('id, name, logo_url, group_id, party_id, is_active')
      .eq('owner_id', user.id);
    // Removed .eq('is_active', true) - owners should see all their companies

    if (!ownedError && ownedCompanies) {
      // Add owned companies that aren't already in the list
      const existingIds = new Set(allCompanies.map(c => c.company_id));
      for (const company of ownedCompanies) {
        if (!existingIds.has(company.id) && company.id && company.name) {
          // Check if invalid before adding
          if (isInvalidCompany(company.name || '')) {
            continue;
          }
          allCompanies.push({
            company_id: company.id,
            company_name: company.name,
            company_logo: company.logo_url,
            user_role: 'owner',
            is_primary: allCompanies.length === 0,
            group_name: null,
            party_id: company.party_id,
            source: 'owned_companies',
            is_active: company.is_active, // Track active status
          });
        }
      }
    }

    // Third try: Get companies linked to parties where user's email matches party contact_email
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
              if (isInvalidCompany(company.name || party?.name_en || ''))
                continue;

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

    // Fourth try: Get companies via employer_employees (if user is an employer)
    // Find companies where user is listed as employer
    try {
      const { data: employerProfile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (employerProfile?.email) {
        // Find parties where user's email matches contact_email
        // Use case-insensitive matching and include both Active and active status
        const { data: employerParties, error: partiesError } = await adminClient
          .from('parties')
          .select('id, name_en, contact_email, type, overall_status')
          .ilike('contact_email', employerProfile.email) // Case-insensitive
          .eq('type', 'Employer')
          .in('overall_status', ['Active', 'active']); // Include both cases

        if (!partiesError && employerParties && employerParties.length > 0) {
          const partyIds = employerParties.map((p: any) => p.id);

          // Find companies linked to these parties
          // Include inactive companies too - user should see all their employer companies
          const { data: employerCompanies, error: employerCompaniesError } =
            await adminClient
              .from('companies')
              .select('id, name, logo_url, group_id, party_id, is_active')
              .in('party_id', partyIds);
          // Removed .eq('is_active', true) - show all employer companies

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

    // Fifth try: Get companies from parties table where type = 'Employer'
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

    // Sixth try: Directly fetch companies from parties table where type = 'Employer'
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
        // Match by contact_email, or if user is associated with the party
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

            // Filter out invalid/mock companies
            if (isInvalidCompany(party.name_en || '')) continue;

            // Check if there's a company linked to this party that user has access to
            const { data: linkedCompany } = await adminClient
              .from('companies')
              .select('id, name, logo_url, owner_id')
              .eq('party_id', party.id)
              .eq('is_active', true)
              .single();

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
                  .single();

                if (membership) {
                  isAssociated = true;
                  userRole = membership.role || 'member';
                }
              }
            }

            // Also check direct party association
            if (!isAssociated) {
              isAssociated =
                (party.contact_email &&
                  (party.contact_email.toLowerCase() ===
                    user.email?.toLowerCase() ||
                    (userProfile?.email &&
                      party.contact_email.toLowerCase() ===
                        userProfile.email.toLowerCase()))) ||
                (party.contact_person &&
                  userProfile?.full_name &&
                  party.contact_person
                    .toLowerCase()
                    .includes(userProfile.full_name.toLowerCase()));

              // Determine user role from party role
              if (isAssociated && party.role) {
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
              } else {
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

    // Include all companies from user_roles (RBAC) so user can access every company under their profile
    try {
      const { data: roleRows } = await adminClient
        .from('user_roles')
        .select('company_id, role')
        .eq('user_id', user.id);
      const roleRowsWithCompany = (roleRows || []).filter(
        (r: any) => r && r.company_id != null
      );
      if (roleRowsWithCompany.length > 0) {
        const companyIdsFromRoles = [
          ...new Set(
            roleRowsWithCompany.map((r: any) => r.company_id).filter(Boolean)
          ),
        ];
        if (companyIdsFromRoles.length > 0) {
          const { data: companiesFromRoles } = await adminClient
            .from('companies')
            .select('id, name, logo_url, group_id, party_id')
            .in('id', companyIdsFromRoles);
          const existingIds = new Set(allCompanies.map((c: any) => c.company_id));
          for (const c of companiesFromRoles || []) {
            if (!c?.id || !c?.name) continue;
            if (existingIds.has(c.id)) continue;
            if (isInvalidCompany(c.name)) continue;
            const roleRow = roleRowsWithCompany.find(
              (r: any) => r.company_id === c.id
            );
            allCompanies.push({
              company_id: c.id,
              company_name: c.name,
              company_logo: c.logo_url,
              user_role: roleRow?.role || 'member',
              is_primary: allCompanies.length === 0,
              group_name: null,
              party_id: c.party_id,
              source: 'user_roles',
            });
          }
        }
      }
    } catch (e) {
      // user_roles may not have company_id in some environments
    }

    // Include employer parties where user has promoters (data belongs to these parties)
    try {
      const { data: promoterEmployers } = await adminClient
        .from('promoters')
        .select('employer_id')
        .not('employer_id', 'is', null)
        .eq('created_by', user.id);
      const employerPartyIds = [
        ...new Set(
          (promoterEmployers || [])
            .map((p: any) => p.employer_id)
            .filter(Boolean)
        ),
      ];
      if (employerPartyIds.length > 0) {
        const { data: parties } = await adminClient
          .from('parties')
          .select('id, name_en, name_ar, logo_url')
          .in('id', employerPartyIds)
          .eq('type', 'Employer');
        const existingIds = new Set(allCompanies.map((c: any) => c.company_id));
        for (const party of parties || []) {
          if (!party?.id || existingIds.has(party.id)) continue;
          const name = party.name_en || party.name_ar || 'Unknown Company';
          if (isInvalidCompany(name)) continue;
          allCompanies.push({
            company_id: party.id,
            company_name: name,
            company_logo: party.logo_url ?? null,
            user_role: 'member',
            is_primary: allCompanies.length === 0,
            group_name: null,
            party_id: party.id,
            source: 'promoters_employer',
          });
        }
      }
    } catch (e) {
      // Non-fatal
    }

    // Get active company from profile using admin client
    const { data: profile } = await adminClient
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    // Determine active_company_id
    let activeCompanyId = profile?.active_company_id;

    // If no active company set but user has companies, set the first one
    if (!activeCompanyId && allCompanies.length > 0) {
      activeCompanyId = allCompanies[0].company_id;

      // Update profile with active company using admin client
      await adminClient
        .from('profiles')
        .update({ active_company_id: activeCompanyId })
        .eq('id', user.id);
    }

    // Remove any duplicates and ensure all companies have valid data
    const uniqueCompanies = Array.from(
      new Map(allCompanies.map(c => [c.company_id, c])).values()
    ).filter(c => c.company_id && c.company_name); // Ensure company has ID and name

    // (minimal=1 is handled by the fast path at the start of the handler and returns above)

    // Fetch group names for all companies
    // Companies can be linked to groups via:
    // 1. companies.group_id (direct reference to holding_groups)
    // 2. holding_group_members table (many-to-many relationship)
    //    - member_type = 'company' (linked via company_id)
    //    - member_type = 'party' (linked via party_id, for parties_employer_direct companies)
    try {
      // First, get all company IDs and party IDs
      const companyIds = uniqueCompanies.map(c => c.company_id);
      const partyIds = uniqueCompanies
        .filter(c => c.party_id)
        .map(c => c.party_id)
        .filter(Boolean);

      // Also include company_ids that are actually party_ids (for parties_employer_direct)
      const partyIdsFromDirect = uniqueCompanies
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
        for (const company of uniqueCompanies) {
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
      for (const company of uniqueCompanies) {
        const groupId = companyGroupMap.get(company.company_id);
        if (groupId) {
          const groupName = groupNameMap.get(groupId);
          if (groupName) {
            company.group_name = groupName;
          }
        }
      }
    } catch (groupError) {
      // Continue without group names if there's an error
    }

    // Enrich companies with feature statistics
    const enrichedCompanies = await Promise.all(
      uniqueCompanies.map(async company => {
        try {
          const today = new Date().toISOString().split('T')[0];

          // Count employees
          let employeesCount = 0;
          try {
            const { count } = await adminClient
              .from('employer_employees')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', company.company_id)
              .eq('employment_status', 'active');
            employeesCount = count || 0;
          } catch (e) {
            // Ignore errors
          }

          // Count attendance records (today)
          let attendanceCount = 0;
          try {
            const { data: employees } = await adminClient
              .from('employer_employees')
              .select('id')
              .eq('company_id', company.company_id)
              .eq('employment_status', 'active');

            if (employees && employees.length > 0) {
              const employeeIds = employees.map((e: any) => e.id);
              const { count } = await adminClient
                .from('employee_attendance')
                .select('id', { count: 'exact', head: true })
                .in('employer_employee_id', employeeIds)
                .eq('attendance_date', today);
              attendanceCount = count || 0;
            }
          } catch (e) {
            // Ignore errors
          }

          // Count active tasks
          let tasksCount = 0;
          try {
            const { data: employees } = await adminClient
              .from('employer_employees')
              .select('id')
              .eq('company_id', company.company_id)
              .eq('employment_status', 'active');

            if (employees && employees.length > 0) {
              const employeeIds = employees.map((e: any) => e.id);
              const { count } = await adminClient
                .from('employee_tasks')
                .select('id', { count: 'exact', head: true })
                .in('employer_employee_id', employeeIds)
                .in('status', ['pending', 'in_progress']);
              tasksCount = count || 0;
            }
          } catch (e) {
            // Ignore errors
          }

          // Count contracts (if party_id exists)
          let contractsCount = 0;
          if (company.party_id) {
            try {
              const { count } = await adminClient
                .from('contracts')
                .select('id', { count: 'exact', head: true })
                .or(
                  `second_party_id.eq.${company.party_id},first_party_id.eq.${company.party_id}`
                );
              contractsCount = count || 0;
            } catch (e) {
              // Ignore errors
            }
          }

          return {
            ...company,
            stats: {
              employees: employeesCount,
              attendance_today: attendanceCount,
              active_tasks: tasksCount,
              contracts: contractsCount,
            },
            features: {
              team_management: employeesCount > 0,
              attendance: true, // Always available
              tasks: tasksCount > 0 || employeesCount > 0,
              targets: employeesCount > 0,
              reports: true, // Always available
              contracts: contractsCount > 0 || company.party_id !== null,
              analytics: employeesCount > 0,
            },
          };
        } catch (error) {
          // Return company without stats if enrichment fails
          return {
            ...company,
            stats: {
              employees: 0,
              attendance_today: 0,
              active_tasks: 0,
              contracts: 0,
            },
            features: {
              team_management: false,
              attendance: true,
              tasks: false,
              targets: false,
              reports: true,
              contracts: company.party_id !== null,
              analytics: false,
            },
          };
        }
      })
    );

    // Log for debugging (always log to help diagnose missing companies)
    const membershipCompanyIds =
      membershipCompanies?.map((cm: any) => cm.company_id) || [];
    const foundCompanyIds = enrichedCompanies.map(c => c.company_id);
    const missingCompanyIds = membershipCompanyIds.filter(
      id => !foundCompanyIds.includes(id)
    );

    logWithCorrelation(
      correlationId,
      'info',
      `Found ${enrichedCompanies.length} companies for user ${user.id}`,
      {
        sources: enrichedCompanies.map(c => ({
          name: c.company_name,
          source: c.source || 'unknown',
          role: c.user_role,
          employees: c.stats?.employees || 0,
          company_id: c.company_id,
        })),
        total_before_dedup: allCompanies.length,
        total_after_dedup: uniqueCompanies.length,
        total_after_enrichment: enrichedCompanies.length,
        filtered_out: allCompanies.length - uniqueCompanies.length,
        membership_count: membershipCompanyIds.length,
        missing_company_ids:
          missingCompanyIds.length > 0
            ? {
                count: missingCompanyIds.length,
                ids: missingCompanyIds,
                note: 'These company_ids from company_members were not included in the final list',
              }
            : null,
      }
    );

    logWithCorrelation(
      correlationId,
      'info',
      'Successfully fetched companies',
      {
        count: enrichedCompanies.length,
      }
    );

    return NextResponse.json(
      {
        success: true,
        companies: enrichedCompanies,
        active_company_id: activeCompanyId,
        correlationId,
      },
      {
        headers: withCorrelationId({}, correlationId),
      }
    );
  } catch (error: any) {
    // Generate correlation ID if not already set
    const errorCorrelationId = correlationId || generateCorrelationId();
    logWithCorrelation(
      errorCorrelationId,
      'error',
      'Error in companies endpoint',
      {
        error: error.message || String(error),
        stack: error.stack,
      }
    );

    // Return empty state instead of error
    return NextResponse.json(
      {
        success: true,
        companies: [],
        active_company_id: null,
        message: 'An error occurred loading companies',
        correlationId: errorCorrelationId,
      },
      {
        headers: withCorrelationId({}, errorCorrelationId),
      }
    );
  }
}

// POST: Create a new company
export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, description, logo_url, business_type, group_id } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create the company using admin client
    const { data: company, error: createError } = await adminClient
      .from('companies')
      .insert({
        name,
        slug,
        description,
        logo_url,
        business_type,
        group_id,
        owner_id: user.id,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      );
    }

    // The trigger will auto-create company_members entry
    // But let's ensure it happened using admin client
    const { data: membership } = await adminClient
      .from('company_members')
      .select('id')
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      // Create membership manually if trigger didn't fire
      await adminClient.from('company_members').insert({
        company_id: company.id,
        user_id: user.id,
        role: 'owner',
        is_primary: true,
        status: 'active',
      });
    }

    return NextResponse.json({
      success: true,
      company,
      message: 'Company created successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
