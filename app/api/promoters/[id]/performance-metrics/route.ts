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
    const period = searchParams.get('period') || 'month';

    const { data, error } = await supabase
      .from('promoter_performance_metrics')
      .select('*')
      .eq('promoter_id', promoterId)
      .eq('period', period)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ metrics: null });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ metrics: data });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
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

    const { data, error } = await supabase
      .from('promoter_performance_metrics')
      .upsert([{
        promoter_id: promoterId,
        period: body.period || 'month',
        contracts_count: body.contracts_count || 0,
        active_contracts: body.active_contracts || 0,
        completed_contracts: body.completed_contracts || 0,
        total_value: body.total_value || 0,
        performance_score: body.performance_score || 0,
        recorded_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }], { onConflict: 'promoter_id,period' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ metrics: data }, { status: 201 });
  } catch (error) {
    console.error('Error recording performance metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
