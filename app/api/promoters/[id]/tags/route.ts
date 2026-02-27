import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: promoterId } = await params;
    const { data, error } = await supabase
      .from('promoter_tags')
      .select('tag, count')
      .eq('promoter_id', promoterId);
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ tags: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tags: data || [] });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: promoterId } = await params;
    const body = await request.json();
    const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

    // Delete existing tags
    await supabase.from('promoter_tags').delete().eq('promoter_id', promoterId);

    // Insert new tags
    if (tags.length > 0) {
      const { error } = await supabase.from('promoter_tags').insert(
        tags.map(tag => ({ promoter_id: promoterId, tag }))
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
