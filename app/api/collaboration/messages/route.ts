import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!channel) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }

    const { data: messages, error } = await supabase
      .from('collaboration_messages')
      .select('*, sender:profiles!sender_id(id, full_name, email, avatar_url)')
      .eq('channel_id', channel)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100));

    if (error) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: (messages || []).reverse() });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channel_id, content, type = 'text' } = await request.json();
    if (!channel_id || !content) {
      return NextResponse.json({ error: 'channel_id and content are required' }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from('collaboration_messages')
      .insert({
        channel_id,
        sender_id: user.id,
        content,
        type,
        created_at: new Date().toISOString(),
      })
      .select('*, sender:profiles!sender_id(id, full_name, email, avatar_url)')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
