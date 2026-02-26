/**
 * CRM Communication Logs API
 * GET  /api/crm/communications  — list communication logs
 * POST /api/crm/communications  — log a new communication
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

export const GET = withRBAC('crm:read:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const contactType = searchParams.get('contact_type');
    const contactId = searchParams.get('contact_id');
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase
      .from('communication_logs')
      .select('*', { count: 'exact' })
      .order('logged_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (contactType) query = query.eq('contact_type', contactType);
    if (contactId) query = query.eq('contact_id', contactId);
    if (channel) query = query.eq('channel', channel);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ communications: data ?? [], total: count ?? 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch communications' },
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

    if (!body.contact_type || !body.contact_id || !body.channel) {
      return NextResponse.json(
        { error: 'contact_type, contact_id, and channel are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('communication_logs')
      .insert({
        contact_type: body.contact_type,
        contact_id: body.contact_id,
        contact_name: body.contact_name,
        contact_email: body.contact_email,
        channel: body.channel,
        direction: body.direction ?? 'outbound',
        subject: body.subject,
        body: body.body,
        outcome: body.outcome,
        duration_mins: body.duration_mins,
        follow_up_date: body.follow_up_date,
        related_contract_id: body.related_contract_id,
        logged_by: user.id,
        logged_at: body.logged_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ communication: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to log communication' },
      { status: 500 }
    );
  }
});
