import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: promoterId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('promoter_attendance_logs')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ logs: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: promoterId } = await params;
    const body = await request.json();

    if (!body.date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('promoter_attendance_logs')
      .insert([{
        promoter_id: promoterId,
        date: body.date,
        check_in_time: body.check_in_time,
        check_out_time: body.check_out_time,
        status: body.status || 'present',
        notes: body.notes,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ log: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await params;
    const body = await request.json();
    const { logId, ...updates } = body;
    if (!logId) return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('promoter_attendance_logs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', logId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ log: data });
  } catch (error) {
    console.error('Error updating attendance log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await params;
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');
    if (!logId) return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });

    const { error } = await supabase.from('promoter_attendance_logs').delete().eq('id', logId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attendance log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
