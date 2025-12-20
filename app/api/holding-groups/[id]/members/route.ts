import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/holding-groups/[id]/members - Get members of a holding group
export const GET = withAnyRBAC(
  ['company:read:all', 'party:read:all'],
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = params;

      const { data: members, error } = await supabase
        .from('holding_group_members')
        .select(`
          *,
          party:parties(id, name_en, name_ar, type, overall_status, contact_email),
          company:companies(id, name, email, is_active)
        `)
        .eq('holding_group_id', id)
        .order('display_order');

      if (error) throw error;

      return NextResponse.json({ data: members });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }
);

// POST /api/holding-groups/[id]/members - Add members to holding group
export const POST = withAnyRBAC(
  ['company:manage:all', 'party:manage:all'],
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = params;
      const body = await request.json();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { member_ids, member_type } = body;

      const members = member_ids.map((memberId: string, index: number) => ({
        holding_group_id: id,
        party_id: member_type === 'party' ? memberId : null,
        company_id: member_type === 'company' ? memberId : null,
        member_type,
        display_order: index,
        created_by: user.id,
      }));

      const { data: insertedMembers, error } = await supabase
        .from('holding_group_members')
        .insert(members)
        .select(`
          *,
          party:parties(id, name_en, name_ar, type, overall_status),
          company:companies(id, name, email, is_active)
        `);

      if (error) throw error;

      return NextResponse.json({ data: insertedMembers }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/holding-groups/[id]/members - Remove members from holding group
export const DELETE = withAnyRBAC(
  ['company:manage:all', 'party:manage:all'],
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = params;
      const { searchParams } = new URL(request.url);
      const memberIds = searchParams.get('member_ids')?.split(',');

      if (!memberIds || memberIds.length === 0) {
        return NextResponse.json(
          { error: 'member_ids parameter required' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('holding_group_members')
        .delete()
        .eq('holding_group_id', id)
        .in('id', memberIds);

      if (error) throw error;

      return NextResponse.json({ message: 'Members removed' });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }
);

