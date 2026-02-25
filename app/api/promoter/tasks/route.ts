import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const promoterId = searchParams.get('promoterId') ?? user.id;

    let query = supabase
      .from('employee_tasks')
      .select('*')
      .eq('assigned_to', promoterId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tasks ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch promoter tasks' },
      { status: 500 }
    );
  }
}
