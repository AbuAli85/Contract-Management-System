import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// DELETE: Remove a member from the company
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    const { id: companyId, memberId } = await params;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Verify user has admin access
    let canEdit = false;

    const { data: myMembership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (myMembership && ['owner', 'admin'].includes(myMembership.role)) {
      canEdit = true;
    } else {
      // Fallback: Check if user owns the company directly
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, owner_id')
        .eq('id', companyId)
        .maybeSingle();

      if (ownedCompany && ownedCompany.owner_id === user.id) {
        canEdit = true;
      }
    }

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get the member to be removed
    const { data: memberToRemove } = await adminClient
      .from('company_members')
      .select('id, user_id, role, is_primary')
      .eq('id', memberId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent removing yourself if you're the only owner/admin
    if (memberToRemove.user_id === user.id && memberToRemove.role === 'owner') {
      // Check if there are other owners
      const { data: otherOwners } = await adminClient
        .from('company_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('role', 'owner')
        .eq('status', 'active')
        .neq('id', memberId);

      if (!otherOwners || otherOwners.length === 0) {
        return NextResponse.json(
          {
            error:
              'Cannot remove the only owner. Please transfer ownership first.',
          },
          { status: 400 }
        );
      }
    }

    // Soft delete: Set status to 'removed' instead of hard delete
    const { error: updateError } = await adminClient
      .from('company_members')
      .update({
        status: 'removed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (updateError) {
      console.error('Error removing member:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: 500 }
    );
  }
}
