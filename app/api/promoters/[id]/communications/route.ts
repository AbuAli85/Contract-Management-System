import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const communicationSchema = z.object({
  communication_type: z.enum(['email', 'sms', 'whatsapp', 'phone', 'in_person', 'system']),
  subject: z.string().max(255).optional(),
  message: z.string().max(5000).optional(),
  sent_at: z.string().datetime().optional(),
  read_at: z.string().datetime().optional().nullable(),
});

async function getAuthenticatedUser(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null, user: null };
  }
  return { error: null, supabase, user };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await getAuthenticatedUser(req);
  if (authError || !supabase || !user) return authError!;

  const { id: promoter_id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  // Verify the promoter exists and user has access
  const { data: promoter, error: promoterError } = await supabase
    .from('promoters')
    .select('id')
    .eq('id', promoter_id)
    .single();

  if (promoterError || !promoter) {
    return NextResponse.json({ error: 'Promoter not found' }, { status: 404 });
  }

  let query = supabase
    .from('promoter_communications')
    .select('*', { count: 'exact' })
    .eq('promoter_id', promoter_id)
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('communication_type', type);
  if (start) query = query.gte('sent_at', start);
  if (end) query = query.lte('sent_at', end);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    communications: data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await getAuthenticatedUser(req);
  if (authError || !supabase || !user) return authError!;

  const { id: promoter_id } = await params;

  // Verify promoter exists
  const { data: promoter, error: promoterError } = await supabase
    .from('promoters')
    .select('id')
    .eq('id', promoter_id)
    .single();

  if (promoterError || !promoter) {
    return NextResponse.json({ error: 'Promoter not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = communicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.issues }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promoter_communications')
    .insert({
      promoter_id,
      ...parsed.data,
      sent_at: parsed.data.sent_at ?? new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, communication: data }, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await getAuthenticatedUser(req);
  if (authError || !supabase || !user) return authError!;

  const { id: promoter_id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, ...updateData } = body as { id?: string; [key: string]: unknown };
  if (!id) {
    return NextResponse.json({ error: 'Communication ID required' }, { status: 400 });
  }

  // Validate update fields
  const parsed = communicationSchema.partial().safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.issues }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promoter_communications')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('promoter_id', promoter_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Communication not found' }, { status: 404 });

  return NextResponse.json({ success: true, communication: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await getAuthenticatedUser(req);
  if (authError || !supabase || !user) return authError!;

  const { id: promoter_id } = await params;

  // Get communication ID from query params or body
  const url = new URL(req.url);
  const idFromQuery = url.searchParams.get('id');
  let communicationId = idFromQuery;

  if (!communicationId) {
    try {
      const body = await req.json();
      communicationId = body.id;
    } catch { /* empty body is fine */ }
  }

  if (!communicationId) {
    return NextResponse.json({ error: 'Communication ID required' }, { status: 400 });
  }

  // Check user role - only admins/managers can delete communications
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions to delete communications' }, { status: 403 });
  }

  const { error } = await supabase
    .from('promoter_communications')
    .delete()
    .eq('id', communicationId)
    .eq('promoter_id', promoter_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Communication deleted' });
}
