import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = params;
  const { data, error } = await supabase
    .from('user_permissions')
    .select('permission, granted')
    .eq('user_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ permissions: data });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = params;
  const { permissions } = await request.json(); // [{ permission, granted }]

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Remove all old, insert new
  await supabase.from('user_permissions').delete().eq('user_id', id);
  if (permissions && permissions.length > 0) {
    await supabase.from('user_permissions').insert(
      permissions.map((p: any) => ({ user_id: id, ...p }))
    );
  }
  return NextResponse.json({ success: true });
} 