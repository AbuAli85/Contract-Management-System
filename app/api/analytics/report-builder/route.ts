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

export const POST = withRBAC('analytics:read:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { definition, save_as }: { definition: ReportDefinition; save_as?: string } = body;

    if (!definition?.entity || !definition?.fields?.length) {
      return NextResponse.json(
        { error: 'entity and fields are required' },
        { status: 400 }
      );
    }

    const table = ENTITY_TABLES[definition.entity];
    if (!table) {
      return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }

    // Validate fields against allowlist to prevent injection
    const allowedFields = ALLOWED_FIELDS[definition.entity];
    const safeFields = definition.fields.filter(f => allowedFields.includes(f));
    if (safeFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields selected' }, { status: 400 });
    }

    let query = supabase
      .from(table)
      .select(safeFields.join(', '), { count: 'exact' })
      .limit(definition.limit ?? 500);

    // Apply date range
    if (definition.date_range) {
      const { from, to, field } = definition.date_range;
      if (allowedFields.includes(field)) {
        query = query.gte(field, from).lte(field, to);
      }
    }

    // Apply filters
    if (definition.filters) {
      for (const filter of definition.filters) {
        if (!allowedFields.includes(filter.field)) continue;
        switch (filter.operator) {
          case 'eq': query = query.eq(filter.field, filter.value as string); break;
          case 'neq': query = query.neq(filter.field, filter.value as string); break;
          case 'gt': query = query.gt(filter.field, filter.value as string); break;
          case 'gte': query = query.gte(filter.field, filter.value as string); break;
          case 'lt': query = query.lt(filter.field, filter.value as string); break;
          case 'lte': query = query.lte(filter.field, filter.value as string); break;
          case 'like': query = query.ilike(filter.field, '%' + filter.value + '%'); break;
          case 'in': query = query.in(filter.field, filter.value as string[]); break;
        }
      }
    }

    // Apply ordering
    if (definition.order_by && allowedFields.includes(definition.order_by)) {
      query = query.order(definition.order_by, { ascending: definition.order_dir !== 'desc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Optionally save the report definition
    if (save_as) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('saved_reports').insert({
        name: save_as,
        definition,
        created_by: user?.id,
      }).select().single();
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      entity: definition.entity,
      fields: safeFields,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run report' },
      { status: 500 }
    );
  }
});
