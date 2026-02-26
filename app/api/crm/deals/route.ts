/**
 * CRM Deals / Sales Pipeline API
 * GET  /api/crm/deals  — list deals with optional stage filter
 * POST /api/crm/deals  — create a new deal
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

export const GET = withRBAC('crm:read:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const stage = searchParams.get('stage');
    const assignedTo = searchParams.get('assigned_to');
    const limit = parseInt(searchParams.get('limit') ?? '100');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (stage) query = query.eq('stage', stage);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);

    const { data, error, count } = await query;
    if (error) throw error;

    // Group by stage for pipeline view
    const pipeline: Record<string, typeof data> = {};
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    stages.forEach(s => { pipeline[s] = []; });
    (data ?? []).forEach(deal => {
      if (pipeline[deal.stage]) pipeline[deal.stage]!.push(deal);
    });

    return NextResponse.json({ deals: data ?? [], pipeline, total: count ?? 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deals' },
      { status: 500 }
    );
  }
});

export const POST = withRBAC('crm:write:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('deals')
      .insert({
        title: body.title,
        contact_type: body.contact_type,
        contact_id: body.contact_id,
        contact_name: body.contact_name,
        stage: body.stage ?? 'lead',
        value: body.value,
        currency: body.currency ?? 'OMR',
        probability: body.probability ?? 50,
        expected_close: body.expected_close,
        assigned_to: body.assigned_to ?? user.id,
        notes: body.notes,
        related_contract_id: body.related_contract_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ deal: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create deal' },
      { status: 500 }
    );
  }
});
