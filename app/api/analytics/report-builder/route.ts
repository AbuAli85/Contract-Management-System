/**
 * Custom Report Builder API
 *
 * POST /api/analytics/report-builder — execute a custom report query
 * GET  /api/analytics/report-builder — list saved report definitions
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

type ReportEntity = 'contracts' | 'employees' | 'promoters' | 'parties' | 'deals' | 'bookings' | 'payroll';

interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: string | number | string[];
}

interface ReportDefinition {
  entity: ReportEntity;
  fields: string[];
  filters?: ReportFilter[];
  group_by?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  limit?: number;
  date_range?: { from: string; to: string; field: string };
}

const ENTITY_TABLES: Record<ReportEntity, string> = {
  contracts: 'contracts',
  employees: 'profiles',
  promoters: 'promoters',
  parties: 'parties',
  deals: 'deals',
  bookings: 'bookings',
  payroll: 'payroll_runs',
};

const ALLOWED_FIELDS: Record<ReportEntity, string[]> = {
  contracts: ['id', 'contract_number', 'status', 'contract_type', 'start_date', 'end_date', 'value', 'currency', 'created_at'],
  employees: ['id', 'full_name', 'email', 'role', 'created_at'],
  promoters: ['id', 'name', 'nationality', 'status', 'created_at'],
  parties: ['id', 'name', 'type', 'status', 'created_at'],
  deals: ['id', 'title', 'stage', 'value', 'currency', 'probability', 'expected_close', 'created_at'],
  bookings: ['id', 'status', 'total_amount', 'currency', 'created_at'],
  payroll: ['id', 'status', 'total_amount', 'currency', 'pay_period_start', 'pay_period_end', 'created_at'],
};

export const GET = withRBAC('analytics:read:own', async (_request: NextRequest) => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet
      return NextResponse.json({ saved_reports: [] });
    }

    return NextResponse.json({ saved_reports: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch reports' },
      { status: 500 }
    );
  }
});

export const POST = withRBAC('analytics:read:own', async (_request: NextRequest) => {
  // For multi-tenant safety, the generic report builder is temporarily disabled
  // until all entity queries are fully scoped by company_id.
  return NextResponse.json(
    {
      error:
        'The report builder is temporarily disabled while we finalize tenant-safe scoping for all entities.',
    },
    { status: 501 }
  );
});
