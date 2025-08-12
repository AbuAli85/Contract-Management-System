/**
 * Optimized Dashboard Analytics API with Pagination
 * Part of Critical Path Optimization Guide implementation
 * Implements efficient analytics queries with caching and pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AnalyticsRequest {
  page: number;
  pageSize: number;
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all';
  metrics?: string[];
  groupBy?: 'day' | 'week' | 'month';
}

interface AnalyticsResponse {
  data: {
    overview: {
      totalContracts: number;
      activeContracts: number;
      pendingApprovals: number;
      completedContracts: number;
      totalRevenue: number;
    };
    trends: Array<{
      date: string;
      contracts_created: number;
      contracts_completed: number;
      revenue: number;
    }>;
    breakdown: {
      byStatus: Array<{ status: string; count: number }>;
      byType: Array<{ type: string; count: number }>;
      byPromoter: Array<{ promoter: string; count: number }>;
    };
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
  performance: {
    queryTime: number;
    cacheHit: boolean;
  };
}

// Enhanced cache with analytics-specific optimization
const analyticsCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    expiry: number;
  }
>();

const ANALYTICS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for analytics

function getAnalyticsCacheKey(request: AnalyticsRequest): string {
  return `analytics:${JSON.stringify(request)}`;
}

function getAnalyticsFromCache(key: string) {
  const cached = analyticsCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  analyticsCache.delete(key);
  return null;
}

function setAnalyticsCache(key: string, data: any) {
  const now = Date.now();
  analyticsCache.set(key, {
    data,
    timestamp: now,
    expiry: now + ANALYTICS_CACHE_DURATION,
  });
}

function getDateRange(timeRange: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (timeRange) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
    default:
      start.setFullYear(2020); // Set to a reasonable start date
      break;
  }

  return { start, end };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AnalyticsRequest = await request.json();
    const {
      page = 1,
      pageSize = 50,
      timeRange = '30d',
      metrics = ['overview', 'trends', 'breakdown'],
      groupBy = 'day',
    } = body;

    // Check cache first
    const cacheKey = getAnalyticsCacheKey(body);
    const cachedResult = getAnalyticsFromCache(cacheKey);

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
    const { start, end } = getDateRange(timeRange);

    // Initialize response data
    const responseData: any = {
      overview: {},
      trends: [],
      breakdown: {},
    };

    // Execute optimized parallel queries
    const queries = [];

    // Overview metrics
    if (metrics.includes('overview')) {
      queries.push(
        supabase
          .from('contracts')
          .select('status, basic_salary, currency', { count: 'exact' })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .then(({ data, count }) => {
            const overview = {
              totalContracts: count || 0,
              activeContracts:
                data?.filter(c => c.status === 'active').length || 0,
              pendingApprovals:
                data?.filter(c => c.status === 'pending_approval').length || 0,
              completedContracts:
                data?.filter(c => c.status === 'completed').length || 0,
              totalRevenue:
                data?.reduce(
                  (sum, c) => sum + (parseFloat(c.basic_salary) || 0),
                  0
                ) || 0,
            };
            responseData.overview = overview;
          })
      );
    }

    // Trends data with pagination
    if (metrics.includes('trends')) {
      let trendsQuery = supabase
        .from('contracts')
        .select('created_at, basic_salary, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      const offset = (page - 1) * pageSize;
      trendsQuery = trendsQuery.range(offset, offset + pageSize - 1);

      queries.push(
        trendsQuery.then(({ data }) => {
          if (data) {
            // Group data by time period
            const groupedData = new Map<
              string,
              {
                contracts_created: number;
                contracts_completed: number;
                revenue: number;
              }
            >();

            data.forEach(contract => {
              const date = new Date(contract.created_at);
              let dateKey: string;

              switch (groupBy) {
                case 'week':
                  const weekStart = new Date(date);
                  weekStart.setDate(date.getDate() - date.getDay());
                  dateKey = weekStart.toISOString().split('T')[0];
                  break;
                case 'month':
                  dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                  break;
                case 'day':
                default:
                  dateKey = date.toISOString().split('T')[0];
                  break;
              }

              if (!groupedData.has(dateKey)) {
                groupedData.set(dateKey, {
                  contracts_created: 0,
                  contracts_completed: 0,
                  revenue: 0,
                });
              }

              const group = groupedData.get(dateKey)!;
              group.contracts_created++;
              group.revenue += parseFloat(contract.basic_salary) || 0;

              if (contract.status === 'completed') {
                group.contracts_completed++;
              }
            });

            responseData.trends = Array.from(groupedData.entries()).map(
              ([date, metrics]) => ({
                date,
                ...metrics,
              })
            );
          }
        })
      );
    }

    // Breakdown analytics
    if (metrics.includes('breakdown')) {
      // Status breakdown
      queries.push(
        supabase
          .from('contracts')
          .select('status', { count: 'exact' })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .then(({ data }) => {
            const statusCounts = new Map<string, number>();
            data?.forEach(contract => {
              const status = contract.status || 'unknown';
              statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
            });

            responseData.breakdown.byStatus = Array.from(
              statusCounts.entries()
            ).map(([status, count]) => ({
              status,
              count,
            }));
          })
      );

      // Contract type breakdown
      queries.push(
        supabase
          .from('contracts')
          .select('contract_type', { count: 'exact' })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .then(({ data }) => {
            const typeCounts = new Map<string, number>();
            data?.forEach(contract => {
              const type = contract.contract_type || 'unknown';
              typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
            });

            responseData.breakdown.byType = Array.from(
              typeCounts.entries()
            ).map(([type, count]) => ({
              type,
              count,
            }));
          })
      );

      // Promoter breakdown (top 10)
      queries.push(
        supabase
          .from('contracts')
          .select(
            `
            promoter:promoters(name_en)
          `,
            { count: 'exact' }
          )
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .then(({ data }) => {
            const promoterCounts = new Map<string, number>();
            data?.forEach((contract: any) => {
              const promoterName = contract.promoter?.name_en || 'No Promoter';
              promoterCounts.set(
                promoterName,
                (promoterCounts.get(promoterName) || 0) + 1
              );
            });

            responseData.breakdown.byPromoter = Array.from(
              promoterCounts.entries()
            )
              .map(([promoter, count]) => ({ promoter, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10); // Top 10 promoters
          })
      );
    }

    // Execute all queries in parallel
    await Promise.all(queries);

    // Calculate pagination info for trends
    const totalTrendsCount = responseData.trends.length;
    const totalPages = Math.ceil(totalTrendsCount / pageSize);

    const response: AnalyticsResponse = {
      data: responseData,
      pagination: {
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      performance: {
        queryTime: Date.now() - startTime,
        cacheHit: false,
      },
    };

    // Cache the result
    setAnalyticsCache(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
        },
      },
      { status: 500 }
    );
  }
}

// Simplified GET endpoint for real-time dashboard updates
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const timeRange =
      (searchParams.get('timeRange') as '7d' | '30d' | '90d' | '1y') || '30d';

    const requestObj: AnalyticsRequest = {
      page: 1,
      pageSize: 10,
      timeRange,
      metrics: ['overview'],
    };

    const cacheKey = getAnalyticsCacheKey(requestObj);
    const cachedResult = getAnalyticsFromCache(cacheKey);

    if (cachedResult) {
      return NextResponse.json({
        data: cachedResult.data.overview,
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: true,
        },
      });
    }

    const supabase = await createClient();
    const { start, end } = getDateRange(timeRange);

    // Quick overview query
    const { data, count } = await supabase
      .from('contracts')
      .select('status, basic_salary', { count: 'exact' })
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const overview = {
      totalContracts: count || 0,
      activeContracts: data?.filter(c => c.status === 'active').length || 0,
      pendingApprovals:
        data?.filter(c => c.status === 'pending_approval').length || 0,
      completedContracts:
        data?.filter(c => c.status === 'completed').length || 0,
      totalRevenue:
        data?.reduce((sum, c) => sum + (parseFloat(c.basic_salary) || 0), 0) ||
        0,
    };

    const response = {
      data: overview,
      performance: {
        queryTime: Date.now() - startTime,
        cacheHit: false,
      },
    };

    // Cache the overview data
    setAnalyticsCache(cacheKey, { data: { overview }, pagination: null });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics GET API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch overview data',
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
        },
      },
      { status: 500 }
    );
  }
}

// Cache management endpoint
export async function DELETE() {
  analyticsCache.clear();
  return NextResponse.json({
    message: 'Analytics cache cleared',
    timestamp: new Date().toISOString(),
  });
}
