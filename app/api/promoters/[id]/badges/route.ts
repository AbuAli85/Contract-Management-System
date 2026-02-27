import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const badgeSchema = z.object({
  badge_type: z.string().min(1).max(100),
  badge_name: z.string().min(1).max(200),
  badge_description: z.string().max(500).optional(),
  badge_icon: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
  earned_at: z.string().datetime().optional(),
});

async function getAuthenticatedUser(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null, user: null, role: null };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return { error: null, supabase, user, role: profile?.role ?? 'viewer' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: promoter_id } = await params;
  const { searchParams } = new URL(req.url);
  const badge_type = searchParams.get('badge_type');
  const is_active = searchParams.get('is_active');

  let query = supabase
    .from('promoter_badges')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('earned_at', { ascending: false });

  if (badge_type) query = query.eq('badge_type', badge_type);
  if (is_active !== null) query = query.eq('is_active', is_active === 'true');

  const { data, error } = await query;
  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ badges: [], message: 'Badges feature not yet configured' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ badges: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, role } = await getAuthenticatedUser(req);
  if (authError || !supabase || !user) return authError!;

  if (!['admin', 'manager'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Insufficient permissions to award badges' }, { status: 403 });
  }

  const { id: promoter_id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = badgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.issues }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promoter_badges')
    .insert({
      promoter_id,
      ...parsed.data,
      earned_at: parsed.data.earned_at ?? new Date().toISOString(),
      awarded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Badges table not yet configured. Run migrations first.' }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, badge: data }, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, role } = await getAuthenticatedUser(req);
  if (authError || !supabase || !user) return authError!;

  if (!['admin', 'manager'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id: promoter_id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, ...updateData } = body as { id?: string; [key: string]: unknown };
  if (!id) {
    return NextResponse.json({ error: 'Badge ID required' }, { status: 400 });
  }

  const parsed = badgeSchema.partial().safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.issues }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promoter_badges')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('promoter_id', promoter_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Badge not found' }, { status: 404 });

  return NextResponse.json({ success: true, badge: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, role } = await getAuthenticatedUser(req);
  if (authError || !supabase || !user) return authError!;

  if (!['admin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Only admins can delete badges' }, { status: 403 });
  }

  const { id: promoter_id } = await params;

  const url = new URL(req.url);
  const idFromQuery = url.searchParams.get('id');
  let badgeId = idFromQuery;

  if (!badgeId) {
    try {
      const body = await req.json();
      badgeId = body.id;
    } catch { /* empty body */ }
  }

  if (!badgeId) {
    return NextResponse.json({ error: 'Badge ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('promoter_badges')
    .delete()
    .eq('id', badgeId)
    .eq('promoter_id', promoter_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Badge removed' });
}
