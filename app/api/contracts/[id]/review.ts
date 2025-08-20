import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';

export const POST = withRBAC(
  'contract:update:own',
  async (
    request: Request,
    { params }: { params: { id: string } }
  ) => {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contractId = params.id;
    const { comment } = await request.json();
    if (!comment)
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });

    const { error } = await supabase
      .from('contract_reviews')
      .insert({ contract_id: contractId, user_id: session.user.id, comment });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
