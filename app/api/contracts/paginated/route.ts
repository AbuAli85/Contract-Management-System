/**
 * Optimized Contracts Pagination API
 * Part of Critical Path Optimization Guide implementation
 * Implements server-side pagination with caching and query optimization
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';
import { createClient } from '@/lib/supabase/server';

interface PaginationRequest {
  page: number;
  pageSize: number;
  search?: string;
  filters?: {
    status?: string[];
    contract_type?: string[];
    date_range?: {
      start: string;
      end: string;
    };
    promoter_id?: string;
    first_party_id?: string;
    second_party_id?: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  performance: {
    queryTime: number;
    cacheHit: boolean;
  };
}

// In-memory cache for frequently requested data
const queryCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    expiry: number;
  }
>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(request: PaginationRequest): string {
  return JSON.stringify({
    page: request.page,
    pageSize: request.pageSize,
    search: request.search,
    filters: request.filters,
    sortBy: request.sortBy,
    sortOrder: request.sortOrder,
  });
}

function getFromCache(key: string) {
  const cached = queryCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  queryCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  const now = Date.now();
  queryCache.set(key, {
    data,
    timestamp: now,
    expiry: now + CACHE_DURATION,
  });

  // Clean up expired entries (simple cleanup)
  if (queryCache.size > 100) {
    for (const [k, v] of queryCache.entries()) {
      if (now > v.expiry) {
        queryCache.delete(k);
      }
    }
  }
}

export const POST = withRBAC(
  'contract:read:own',
  async (request: NextRequest) => {
    const startTime = Date.now();

    try {
      const supabase = await createClient();
      const body: PaginationRequest = await request.json();

      const {
        page = 1,
        pageSize = 20,
        search = '',
        filters = {},
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = body;

      // Validate pagination parameters
      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return NextResponse.json(
          { error: 'Invalid pagination parameters' },
          { status: 400 }
        );
      }

      // Check cache first
      const cacheKey = getCacheKey(body);
      const cachedResult = getFromCache(cacheKey);

      if (cachedResult) {
        return NextResponse.json({
          ...cachedResult,
          performance: {
            queryTime: Date.now() - startTime,
            cacheHit: true,
          },
        });
      }

      // Build optimized query
      let query = supabase.from('contracts').select(
        `
        id,
        contract_number,
        contract_type,
        status,
        approval_status,
        basic_salary,
        currency,
        contract_start_date,
        contract_end_date,
        created_at,
        updated_at,
        first_party:parties!first_party_id(id, name_en, name_ar),
        second_party:parties!second_party_id(id, name_en, name_ar),
        promoter:promoters(id, name_en, mobile_number)
      `,
        { count: 'exact' }
      );

      // Apply search filter
      if (search) {
        query = query.or(`
        contract_number.ilike.%${search}%,
        first_party.name_en.ilike.%${search}%,
        second_party.name_en.ilike.%${search}%,
        promoter.name_en.ilike.%${search}%
      `);
      }

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.contract_type && filters.contract_type.length > 0) {
        query = query.in('contract_type', filters.contract_type);
      }

      if (filters.date_range) {
        if (filters.date_range.start) {
          query = query.gte('created_at', filters.date_range.start);
        }
        if (filters.date_range.end) {
          query = query.lte('created_at', filters.date_range.end);
        }
      }

      if (filters.promoter_id) {
        query = query.eq('promoter_id', filters.promoter_id);
      }

      if (filters.first_party_id) {
        query = query.eq('first_party_id', filters.first_party_id);
      }

      if (filters.second_party_id) {
        query = query.eq('second_party_id', filters.second_party_id);
      }

      // Apply sorting
      const validSortFields = [
        'created_at',
        'updated_at',
        'contract_number',
        'status',
        'basic_salary',
        'contract_start_date',
        'contract_end_date',
      ];

      if (validSortFields.includes(sortBy)) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      // Execute query
      const { data, count, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch contracts' },
          { status: 500 }
        );
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      const response: PaginationResponse<any> = {
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
        },
      };

      // Cache the result
      setCache(cacheKey, response);

      return NextResponse.json(response);
    } catch (error) {
      console.error('Pagination API error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          performance: {
            queryTime: Date.now() - startTime,
            cacheHit: false,
          },
        },
        { status: 500 }
      );
    }
  }
);

// GET endpoint for simple pagination without complex filtering
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || '20'),
      100
    );
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder =
      (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Build request object for caching
    const requestObj: PaginationRequest = {
      page,
      pageSize,
      search,
      filters: status ? { status: [status] } : {},
      sortBy,
      sortOrder,
    };

    // Check cache
    const cacheKey = getCacheKey(requestObj);
    const cachedResult = getFromCache(cacheKey);

    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: true,
        },
      });
    }

    const supabase = await createClient();

    // Optimized query for simple cases
    let query = supabase.from('contracts').select(
      `
        id,
        contract_number,
        status,
        basic_salary,
        currency,
        created_at,
        first_party:parties!first_party_id(name_en),
        second_party:parties!second_party_id(name_en)
      `,
      { count: 'exact' }
    );

    if (search) {
      query = query.ilike('contract_number', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * pageSize;
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const response: PaginationResponse<any> = {
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      performance: {
        queryTime: Date.now() - startTime,
        cacheHit: false,
      },
    };

    // Cache the result
    setCache(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET Pagination API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
        },
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Entries': queryCache.size.toString(),
      'Cache-Status': 'healthy',
    },
  });
}
