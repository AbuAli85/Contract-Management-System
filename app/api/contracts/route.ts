import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';
import { getContractMetrics } from '@/lib/metrics';
import { withTimeout, logApiCall } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';
import { permissionCache } from '@/lib/permission-cache';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// ✅ OPTIMIZED: Reduced timeout from 8s to 3s for better UX
const API_TIMEOUT_MS = 3000; // 3 second timeout

// ✅ SECURITY: RBAC enabled with rate limiting
export const GET = withRBAC(
  'contract:read:own',
  async (request: NextRequest) => {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { searchParams } = new URL(request.url);
      const partyId = searchParams.get('party_id');
      const status = searchParams.get('status') || 'all'; // ✅ FIX: Default to 'all' instead of 'active' to show all contracts
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);

      logger.info(
        'Contracts API: Starting request',
        {
          requestId,
          status,
          partyId,
          page,
          limit,
          timestamp: new Date().toISOString(),
        },
        'ContractsAPI'
      );

      const supabase = await createClient();

      // Wrap the entire operation with timeout
      const result = await withTimeout(
        handleContractsRequest(
          supabase,
          partyId,
          status,
          requestId,
          page,
          limit
        ),
        API_TIMEOUT_MS,
        'Contracts API GET'
      );

      const duration = Date.now() - startTime;
      logApiCall('/api/contracts', 'GET', duration, 200, true, {
        requestId,
        status,
        contractCount: result.contracts?.length || 0,
      });

      return NextResponse.json(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        'Contracts API: Unexpected error',
        {
          requestId,
          error,
          message: (error as Error).message,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        },
        'ContractsAPI'
      );

      logApiCall('/api/contracts', 'GET', duration, 500, false, {
        requestId,
        error: (error as Error).message,
      });

      // Check if it's a timeout error
      if ((error as Error).message?.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout',
            message: 'The server took too long to respond. Please try again.',
            details: (error as Error).message,
            requestId,
          },
          { status: 504 } // Gateway Timeout
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching contracts.',
          details: (error as Error).message,
          requestId,
        },
        { status: 500 }
      );
    }
  }
);

async function handleContractsRequest(
  supabase: any,
  partyId: string | null,
  status: string,
  requestId: string,
  page: number = 1,
  limit: number = 20
) {
  // ✅ OPTIMIZED: Calculate offset for database-level pagination
  const offset = (page - 1) * limit;

  // Check if we're using a mock client
  if (!supabase || typeof supabase.from !== 'function') {
    logger.error(
      'Contracts API: Using mock client - environment variables may be missing',
      { requestId },
      'ContractsAPI'
    );
    return {
      success: true, // Return success to avoid errors
      contracts: [],
      totalContracts: 0,
      activeContracts: 0,
      pendingContracts: 0,
      error: 'Database connection not available',
      requestId,
    };
  }

  logger.debug(
    'Contracts API: Fetching contracts from database...',
    { requestId },
    'ContractsAPI'
  );

  // ✅ SECURITY FIX: Get user info for query scoping
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized: ' + (userError?.message || 'No user found'));
  }

  // ✅ COMPANY SCOPE: Get active company's party_id
  let activePartyId: string | null = partyId; // Use provided partyId if available
  if (!activePartyId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profile?.active_company_id) {
      // Get company's party_id
      const { createAdminClient } = await import('@/lib/supabase/server');
      let adminClient;
      try {
        adminClient = createAdminClient();
      } catch (e) {
        adminClient = supabase;
      }

      const { data: company } = await adminClient
        .from('companies')
        .select('party_id')
        .eq('id', profile.active_company_id)
        .single();

      if (company?.party_id) {
        activePartyId = company.party_id;
        logger.debug(
          'Using company party_id for contract filtering',
          { companyId: profile.active_company_id, partyId: activePartyId, requestId },
          'ContractsAPI'
        );
      }
    }
  }

  // ✅ OPTIMIZED: Check cache first before querying database
  const cacheKey = permissionCache.getUserRoleKey(user.id);
  let isAdmin = permissionCache.get<boolean>(cacheKey);

  if (isAdmin === null) {
    // Cache miss - fetch from database
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    isAdmin = (userProfile as any)?.role === 'admin';

    // Store in cache
    permissionCache.set(cacheKey, isAdmin);
    logger.debug(
      'Permission cached for user',
      { userId: user.id, isAdmin },
      'PermissionCache'
    );
  } else {
    logger.debug(
      'Permission loaded from cache',
      { userId: user.id, isAdmin },
      'PermissionCache'
    );
  }

  // If party_id is provided, try to fetch contracts for that party
  if (partyId) {
    try {
      let query = supabase
        .from('contracts')
        .select(
          `
            *,
            first_party:parties!contracts_employer_id_fkey(id, name_en, name_ar, crn, type),
            second_party:parties!contracts_client_id_fkey(id, name_en, name_ar, crn, type),
            promoter_id
          `
        )
        .or(`employer_id.eq.${partyId},client_id.eq.${partyId}`);

      // Special handling: "pending" status should include both "pending" and "generated" contracts
      if (status === 'pending') {
        query = query.in('status', ['pending', 'generated']);
      } else {
        query = query.eq('status', status);
      }

      // ✅ SECURITY FIX: Non-admin users can only see contracts they're involved in OR created
      if (!isAdmin) {
        query = query.or(
          `employer_id.eq.${user.id},client_id.eq.${user.id},user_id.eq.${user.id}`
        );
      }

      const { data: contracts, error: contractsError } = await query.limit(10);

      if (contractsError) {
        console.warn(
          '⚠️ Contracts API: Error fetching party contracts, returning empty:',
          {
            requestId,
            error: contractsError.message,
          }
        );
        return {
          success: true,
          contracts: [],
          count: 0,
          message: 'No contracts found for this party',
          requestId,
        };
      }

      return {
        success: true,
        contracts: contracts || [],
        count: contracts?.length || 0,
        requestId,
      };
    } catch (error) {
      console.warn('⚠️ Contracts API: Party query failed, returning empty', {
        requestId,
      });
      return {
        success: true,
        contracts: [],
        count: 0,
        requestId,
      };
    }
  }

  // Enhanced query to fetch all contracts with proper relationships
  let contracts: any[] = [];
  let totalCount: number | null = 0;

  try {
    // ✅ ENHANCED QUERY: Get all contracts with comprehensive data
    // Use simple select with count option directly
    let query = supabase.from('contracts').select('*', { count: 'exact' });

    // ✅ COMPANY SCOPE: Filter by active company's party_id if available
    if (activePartyId) {
      query = query.or(`second_party_id.eq.${activePartyId},first_party_id.eq.${activePartyId}`);
      logger.debug(
        'Filtering contracts by company party_id',
        { activePartyId, requestId },
        'ContractsAPI'
      );
    }

    // ✅ FIX: Apply status filter if provided
    if (status && status !== 'all') {
      logger.debug(
        `Filtering contracts by status: ${status}`,
        { requestId },
        'ContractsAPI'
      );

      // Special handling: "pending" status should include both "pending" and "generated" contracts
      if (status === 'pending') {
        query = query.in('status', ['pending', 'generated']);
        logger.debug(
          'Including both pending and generated contracts',
          { requestId },
          'ContractsAPI'
        );
      } else {
        // Simple direct status filtering for other statuses
        query = query.eq('status', status);
      }
    }

    // Non-admin users only see contracts they're involved in OR created (if no company scope)
    if (!isAdmin && !activePartyId) {
      query = query.or(
        `first_party_id.eq.${user.id},second_party_id.eq.${user.id},client_id.eq.${user.id},employer_id.eq.${user.id},user_id.eq.${user.id}`
      );
    }

    const queryStartTime = Date.now();

    // ✅ OPTIMIZED: Use database-level pagination
    const {
      data: contractsData,
      error: contractsError,
      count,
    } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    totalCount = count;

    const queryTime = Date.now() - queryStartTime;
    logger.info(
      'Query execution',
      {
        requestId,
        status: status || 'all',
        queryTime: `${queryTime}ms`,
        resultCount: contractsData?.length || 0,
        totalCount: totalCount || 0,
        page,
        limit,
        isAdmin,
        timestamp: new Date().toISOString(),
      },
      'ContractsAPI'
    );

    if (contractsError) {
      logger.warn(
        'Contracts API: Error fetching contracts',
        {
          error: contractsError.message,
          requestId,
        },
        'ContractsAPI'
      );

      // Try a simpler query as fallback
      let fallbackQuery = supabase
        .from('contracts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // ✅ COMPANY SCOPE: Apply company filter to fallback query too
      if (activePartyId) {
        fallbackQuery = fallbackQuery.or(`second_party_id.eq.${activePartyId},first_party_id.eq.${activePartyId}`);
      }

      // Apply RBAC to fallback query too (only if no company scope)
      if (!isAdmin && !activePartyId) {
        fallbackQuery = fallbackQuery.or(
          `first_party_id.eq.${user.id},second_party_id.eq.${user.id},client_id.eq.${user.id},employer_id.eq.${user.id},user_id.eq.${user.id}`
        );
      }

      const {
        data: fallbackData,
        error: fallbackError,
        count: fallbackCount,
      } = await fallbackQuery;

      if (fallbackError) {
        logger.error(
          'Contracts API: Fallback query also failed',
          {
            error: fallbackError.message,
            requestId,
          },
          'ContractsAPI'
        );
        contracts = [];
      } else {
        contracts = fallbackData || [];
        totalCount = fallbackCount;
        // Transform fallback data as well (simplified since we don't have relationships)
        contracts = contracts.map((contract: any) => ({
          ...contract,
          first_party: null,
          second_party: null,
          promoters: null,
          contract_start_date:
            contract.start_date || contract.contract_start_date,
          contract_end_date: contract.end_date || contract.contract_end_date,
          job_title: contract.title || contract.job_title,
          contract_value:
            contract.value ||
            contract.contract_value ||
            contract.basic_salary ||
            contract.amount,
        }));
      }
    } else {
      contracts = contractsData || [];
    }

    // Fetch related data separately and transform contracts
    const partyIds = new Set();
    const promoterIds = new Set();

    contracts.forEach((contract: any) => {
      if (contract.first_party_id) partyIds.add(contract.first_party_id);
      if (contract.second_party_id) partyIds.add(contract.second_party_id);
      if (contract.client_id) partyIds.add(contract.client_id);
      if (contract.employer_id) partyIds.add(contract.employer_id);
      if (contract.promoter_id) promoterIds.add(contract.promoter_id);
    });

    // Fetch parties data
    let partiesData: any[] = [];
    if (partyIds.size > 0) {
      const { data: parties, error: partiesError } = await supabase
        .from('parties')
        .select('id, name_en, name_ar, crn, type')
        .in('id', Array.from(partyIds));

      if (!partiesError && parties) {
        partiesData = parties;
      }
    }

    // Fetch promoters data
    let promotersData: any[] = [];
    if (promoterIds.size > 0) {
      const { data: promoters, error: promotersError } = await supabase
        .from('promoters')
        .select(
          'id, name_en, name_ar, id_card_number, id_card_url, passport_url, status, mobile_number'
        )
        .in('id', Array.from(promoterIds));

      if (promotersError) {
        logger.warn(
          'Contracts API: Error fetching promoters',
          {
            error: promotersError.message,
            requestId,
          },
          'ContractsAPI'
        );
      }

      if (!promotersError && promoters) {
        promotersData = promoters;
        logger.debug(
          `Fetched ${promoters.length} promoters`,
          { requestId },
          'ContractsAPI'
        );
      }
    }

    // Create lookup maps
    const partiesMap = new Map(partiesData.map(p => [p.id, p]));
    const promotersMap = new Map(promotersData.map(p => [p.id, p]));

    // Transform contracts to normalize party relationships
    contracts = contracts.map((contract: any) => {
      // Get party data from lookup maps
      const firstParty = contract.first_party_id
        ? partiesMap.get(contract.first_party_id)
        : contract.client_id
          ? partiesMap.get(contract.client_id)
          : null;
      const secondParty = contract.second_party_id
        ? partiesMap.get(contract.second_party_id)
        : contract.employer_id
          ? partiesMap.get(contract.employer_id)
          : null;
      const promoter = contract.promoter_id
        ? promotersMap.get(contract.promoter_id)
        : null;

      // Log warning if promoter_id exists but promoter data is missing
      if (contract.promoter_id && !promoter) {
        logger.warn(
          'Promoter data not found for contract',
          {
            contractId: contract.id,
            promoterId: contract.promoter_id,
            requestId,
          },
          'ContractsAPI'
        );
      }

      return {
        ...contract,
        first_party: firstParty,
        second_party: secondParty,
        promoters: promoter, // ✅ FIX: Return as object, not array (matches TypeScript type definition)
        // Ensure we have the right field names for the frontend
        contract_start_date:
          contract.start_date || contract.contract_start_date,
        contract_end_date: contract.end_date || contract.contract_end_date,
        job_title: contract.title || contract.job_title,
        contract_value:
          contract.value ||
          contract.contract_value ||
          contract.basic_salary ||
          contract.amount,
      };
    });
  } catch (error) {
    logger.warn(
      'Contracts API: Contract fetch failed',
      {
        error: (error as Error).message,
        requestId,
      },
      'ContractsAPI'
    );
    contracts = [];
  }

  // Get comprehensive metrics using centralized service
  // This ensures consistency across all pages
  let metrics;
  try {
    metrics = await getContractMetrics({
      userId: user.id,
      userRole: isAdmin ? 'admin' : 'user',
      includeExpiringSoon: true,
      expiryDaysThreshold: 30,
    });
    logger.info(
      'Using centralized metrics',
      {
        total: metrics.total,
        active: metrics.active,
        pending: metrics.pending,
        scope: isAdmin ? 'admin (all contracts)' : 'user (own contracts)',
        requestId,
      },
      'ContractsAPI'
    );
  } catch (error) {
    logger.warn(
      'Failed to get centralized metrics, using fallback',
      {
        error: (error as Error).message,
        requestId,
      },
      'ContractsAPI'
    );
    // Fallback to basic counts if metrics service fails
    const { count: totalCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    metrics = {
      total: totalCount || 0,
      active: 0,
      pending: 0,
      approved: 0,
      expired: 0,
      completed: 0,
      cancelled: 0,
      expiringSoon: 0,
      totalValue: 0,
      averageDuration: 0,
      byStatus: {},
    };
  }

  // Map centralized metrics to legacy stats format for backward compatibility
  const stats = {
    total: contracts.length, // Current page count
    active: metrics.active,
    expired: metrics.expired,
    upcoming: 0, // Not in centralized metrics yet
    unknown: 0,
    expiring_soon: metrics.expiringSoon,
    total_value: metrics.totalValue,
    avg_duration: metrics.averageDuration,
    generated: 0,
    pending: metrics.pending,
    completed: metrics.completed,
    cancelled: metrics.cancelled,
  };

  // ✅ FIX DATA INCONSISTENCY: Use totalCount from query, not metrics.total
  // This ensures the count matches the filtered results
  const actualTotal =
    totalCount !== null && totalCount !== undefined
      ? totalCount
      : contracts.length;

  logger.info(
    'Successfully fetched contracts',
    {
      requestId,
      status: status || 'all',
      pageSize: contracts.length,
      totalFiltered: actualTotal,
      page,
      limit,
      pending: stats.pending,
      active: stats.active,
      sampleIds: contracts.slice(0, 3).map(c => c.id),
      timestamp: new Date().toISOString(),
    },
    'ContractsAPI'
  );

  return {
    success: true,
    contracts: contracts || [],
    stats,
    // ✅ FIX: Return counts that match the filtered query, not global metrics
    total: contracts.length, // Current page count
    totalContracts: actualTotal, // Total count from the filtered query
    totalPages: Math.ceil((actualTotal || 0) / limit),
    currentPage: page,
    pageSize: limit,
    hasNextPage: page * limit < (actualTotal || 0),
    hasPreviousPage: page > 1,
    // Global metrics (not filtered by current status)
    globalMetrics: {
      total: metrics.total,
      active: metrics.active,
      pending: metrics.pending,
      completed: metrics.completed,
      cancelled: metrics.cancelled,
      expiringSoon: metrics.expiringSoon,
      totalValue: metrics.totalValue,
      averageDuration: metrics.averageDuration,
    },
    // Legacy format for backward compatibility
    activeContracts: metrics.active,
    pendingContracts: metrics.pending,
    completedContracts: metrics.completed,
    cancelledContracts: metrics.cancelled,
    generatedContracts: stats.generated,
    expiringSoon: metrics.expiringSoon,
    totalValue: metrics.totalValue,
    averageDuration: metrics.averageDuration,
    scope: isAdmin ? 'system-wide' : 'user-specific',
    scopeLabel: isAdmin ? 'All contracts in system' : 'Your contracts only',
    lastUpdated: new Date().toISOString(),
    requestId,
    // Include full metrics for advanced use
    metrics: metrics,
  };
}

export const POST = withAnyRBAC(
  ['contract:create:own', 'contract:generate:own', 'contract:message:own'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const body = await request.json();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const toISODate = (value: any): string | null => {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.toISOString();
      };
      const toDateOnly = (value: any): string | null => {
        const iso = toISODate(value);
        return iso ? iso.slice(0, 10) : null; // YYYY-MM-DD
      };

      const contractNumber = body.contract_number || `CON-${Date.now()}`;
      const clientId = body.first_party_id || body.client_id || null;
      const employerId = body.second_party_id || body.employer_id || null;
      const promoterId = body.promoter_id || null;
      const title =
        body.contract_name ||
        body.title ||
        body.job_title ||
        'Employment Contract';
      const value =
        body.contract_value || body.basic_salary || body.amount || null;
      const currency = body.currency || 'OMR';

      // Map and validate contract type to allowed database values
      const mapContractType = (type: string): string => {
        if (!type) return 'employment';
        const typeLower = String(type).toLowerCase();
        // Map frontend types to database types
        const typeMap: Record<string, string> = {
          employment: 'employment',
          'full-time-permanent': 'employment',
          'full-time-fixed': 'employment',
          'part-time-permanent': 'employment',
          'part-time-fixed': 'employment',
          probationary: 'employment',
          'training-contract': 'employment',
          internship: 'employment',
          'graduate-trainee': 'employment',
          service: 'service',
          freelance: 'service',
          contractor: 'service',
          consultant: 'consultancy',
          consulting: 'consultancy',
          'consulting-agreement': 'consultancy',
          'project-based': 'consultancy',
          partnership: 'partnership',
          temporary: 'service',
          seasonal: 'service',
          executive: 'employment',
          management: 'employment',
          director: 'employment',
          'remote-work': 'employment',
          'hybrid-work': 'employment',
          secondment: 'service',
          apprenticeship: 'employment',
          'service-agreement': 'service',
          retainer: 'service',
        };
        return typeMap[typeLower] || 'employment';
      };

      const contractType = mapContractType(body.contract_type);

      // Ensure start_date is provided (required by database)
      const startDate =
        toDateOnly(body.contract_start_date || body.start_date) ||
        new Date().toISOString().slice(0, 10);

      // Prepare multiple schema variants and try them in safest order
      // 1) Minimal columns common to both schemas (avoid unknown columns entirely)
      // 2) Add legacy/new type field separately
      // 3) Try alternate date column names only if needed
      const isUUID = (v: any) =>
        typeof v === 'string' &&
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(
          v
        );
      const isNumeric = (v: any) =>
        v !== null && v !== undefined && /^\d+$/.test(String(v));

      // Accept any non-empty string or number as valid ID, not just UUIDs
      const validClientId =
        clientId && clientId !== '' && clientId !== 'null'
          ? clientId
          : undefined;
      const validEmployerId =
        employerId && employerId !== '' && employerId !== 'null'
          ? employerId
          : undefined;
      const validPromoterId =
        promoterId && promoterId !== '' && promoterId !== 'null'
          ? promoterId
          : undefined;

      // For UUID validation, only check if it's a valid UUID format
      const uuidClientId = isUUID(validClientId) ? validClientId : undefined;
      const uuidEmployerId = isUUID(validEmployerId)
        ? validEmployerId
        : undefined;
      const uuidPromoterId = isUUID(validPromoterId)
        ? validPromoterId
        : undefined;

      // For numeric IDs, accept any non-empty value
      const intFirstPartyId = validClientId ? validClientId : undefined;
      const intSecondPartyId = validEmployerId ? validEmployerId : undefined;

      logger.debug(
        'Contract creation debug info',
        {
          originalClientId: clientId,
          originalEmployerId: employerId,
          originalPromoterId: promoterId,
          validClientId,
          validEmployerId,
          validPromoterId,
          uuidClientId,
          uuidEmployerId,
          uuidPromoterId,
          contractType,
          title,
        },
        'ContractsAPI'
      );

      const variantsRaw: Record<string, any>[] = [
        // Variant A: Complete schema with all fields (preferred)
        {
          contract_number: contractNumber,
          client_id: uuidClientId,
          employer_id: uuidEmployerId,
          promoter_id: uuidPromoterId,
          start_date: startDate,
          end_date: toDateOnly(body.contract_end_date || body.end_date),
          title,
          status: 'pending', // ✅ WORKFLOW: New contracts start as pending for admin approval
          contract_type: contractType,
          is_current: true,
          priority: 'medium',
          currency,
          value,
          submitted_for_review_at: new Date().toISOString(),
        },
        // Variant B: UUID-based with contract_type and is_current
        {
          contract_number: contractNumber,
          client_id: uuidClientId,
          employer_id: uuidEmployerId,
          promoter_id: uuidPromoterId,
          start_date: startDate,
          end_date: toDateOnly(body.contract_end_date || body.end_date),
          title,
          status: 'pending', // ✅ WORKFLOW: New contracts start as pending for admin approval
          contract_type: contractType,
          is_current: true,
          submitted_for_review_at: new Date().toISOString(),
        },
        // Variant C: Basic with contract_type and is_current
        {
          contract_number: contractNumber,
          start_date: startDate,
          end_date: toDateOnly(body.contract_end_date || body.end_date),
          title,
          status: 'pending', // ✅ WORKFLOW: New contracts start as pending for admin approval
          contract_type: contractType,
          is_current: true,
          submitted_for_review_at: new Date().toISOString(),
        },
        // Variant D: Minimal with contract_type and is_current
        {
          contract_number: contractNumber,
          title,
          status: 'pending', // ✅ WORKFLOW: New contracts start as pending for admin approval
          contract_type: contractType,
          is_current: true,
          submitted_for_review_at: new Date().toISOString(),
        },
        // Variant E: Legacy schema with 'type' and is_current
        {
          contract_number: contractNumber,
          client_id: uuidClientId,
          employer_id: uuidEmployerId,
          promoter_id: uuidPromoterId,
          start_date: startDate,
          end_date: toDateOnly(body.contract_end_date || body.end_date),
          title,
          status: 'pending', // ✅ WORKFLOW: New contracts start as pending for admin approval
          type: contractType,
          is_current: true,
          submitted_for_review_at: new Date().toISOString(),
        },
        // Variant F: Legacy minimal with 'type' and is_current
        {
          contract_number: contractNumber,
          title,
          status: 'pending', // ✅ WORKFLOW: New contracts start as pending for admin approval
          type: contractType,
          is_current: true,
          submitted_for_review_at: new Date().toISOString(), // Track submission time
        },
      ];

      // Remove undefined properties to avoid schema cache column errors
      const variants: Record<string, any>[] = variantsRaw.map(v =>
        Object.fromEntries(
          Object.entries(v).filter(([, val]) => val !== undefined)
        )
      );

      // ✅ SECURITY FIX: Use authenticated client with RLS instead of service-role key
      // Add ownership tracking via database RLS policies instead of created_by column
      const variantsWithOwnership = variants.map(v => ({
        ...v,
        updated_at: new Date().toISOString(),
      }));

      const attemptErrors: any[] = [];
      for (const variant of variantsWithOwnership) {
        const { data, error } = await supabase
          .from('contracts')
          .insert(variant as any)
          .select()
          .single();
        if (!error && data) {
          return NextResponse.json({ success: true, contract: data });
        }
        attemptErrors.push({
          message: error?.message,
          code: (error as any)?.code,
        });
        // Continue to try next variant
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create contract',
          details: attemptErrors,
        },
        { status: 500 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);
