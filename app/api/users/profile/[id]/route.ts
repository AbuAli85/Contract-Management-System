import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/types/custom';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const targetUserId = params.id;
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const userProfile = { id: profile.id, email: profile.email || '', full_name: profile.full_name, avatar_url: profile.avatar_url, role: profile.role, created_at: profile.created_at, last_login: profile.last_login };
    return NextResponse.json(userProfile);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}