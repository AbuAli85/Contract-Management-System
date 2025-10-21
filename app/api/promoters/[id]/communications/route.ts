import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { PromoterCommunication } from '@/lib/types';
import { NextRequest } from 'next/server';

const communicationSchema = z.object({
  communication_type: z.string(),
  subject: z.string().optional(),
  message: z.string().optional(),
  sent_at: z.string().optional(),
  read_at: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('promoter_communications')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('sent_at', { ascending: false });

  if (type) query = query.eq('communication_type', type);
  if (start) query = query.gte('sent_at', start);
  if (end) query = query.lte('sent_at', end);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const body = await req.json();
  const parsed = communicationSchema.safeParse(body);

  if (!parsed.success)
    return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('promoter_communications')
    .insert({
      promoter_id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const body = await req.json();
  const { id, ...updateData } = body;

  if (!id)
    return NextResponse.json(
      { error: 'Communication ID required' },
      { status: 400 }
    );

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('promoter_communications')
    .update(updateData)
    .eq('id', id)
    .eq('promoter_id', promoter_id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const { id } = await req.json();

  if (!id)
    return NextResponse.json(
      { error: 'Communication ID required' },
      { status: 400 }
    );

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('promoter_communications')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
