import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const workItemId = params.id;

    // Resolve active company from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.active_company_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active company set. Please select an active company first.',
        },
        { status: 400 }
      );
    }

    const companyId = profile.active_company_id;

    const { error: updateError } = await supabase
      .from('work_items' as any)
      .update({ assignee_id: user.id })
      .eq('id', workItemId)
      .eq('company_id', companyId);

    if (updateError) {
      logger.error(
        'Failed to assign work_item to current user',
        { error: updateError, workItemId, companyId },
        '/api/inbox/[id]/assign'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to assign work item',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Work item assigned to current user',
    });
  } catch (error: any) {
    logger.error(
      'Unexpected error in PATCH /api/inbox/[id]/assign',
      { error },
      '/api/inbox/[id]/assign'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

