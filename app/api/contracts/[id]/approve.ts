import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contractId = params.id;
  const { error } = await supabase
    .from('contracts')
    .update({ status: 'approved' })
    .eq('id', contractId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
