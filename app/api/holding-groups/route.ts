import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/holding-groups - List all holding groups with their members
export const GET = withAnyRBAC(
  ['company:read:all', 'party:read:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);
      const includeMembers = searchParams.get('include_members') === 'true';

      // Get holding groups
      const { data: holdingGroups, error: groupsError } = await supabase
        .from('holding_groups')
        .select('*')
        .eq('is_active', true)
        .order('name_en');

      if (groupsError) throw groupsError;

      if (!includeMembers) {
        return NextResponse.json({ data: holdingGroups });
      }

      // Get members for each holding group
      const { data: members, error: membersError } = await supabase
        .from('holding_group_members')
        .select(`
          *,
          party:parties(id, name_en, name_ar, type, overall_status),
          company:companies(id, name, email, is_active)
        `)
        .in('holding_group_id', holdingGroups.map(g => g.id));

      if (membersError) throw membersError;

      // Group members by holding group
      const groupsWithMembers = holdingGroups.map(group => ({
        ...group,
        members: members?.filter(m => m.holding_group_id === group.id) || []
      }));

      return NextResponse.json({ data: groupsWithMembers });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }
);

// POST /api/holding-groups - Create a new holding group
export const POST = withAnyRBAC(
  ['company:manage:all', 'party:manage:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const body = await request.json();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { name_en, name_ar, description, logo_url, member_ids } = body;

      // Create holding group
      const { data: holdingGroup, error: groupError } = await supabase
        .from('holding_groups')
        .insert({
          name_en,
          name_ar,
          description,
          logo_url,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members if provided
      if (member_ids && member_ids.length > 0) {
        const members = member_ids.map((memberId: string, index: number) => {
          // Determine if it's a party or company ID
          // You may need to check both tables or pass member_type
          return {
            holding_group_id: holdingGroup.id,
            party_id: body.member_type === 'party' ? memberId : null,
            company_id: body.member_type === 'company' ? memberId : null,
            member_type: body.member_type || 'party',
            display_order: index,
            created_by: user.id,
          };
        });

        const { error: membersError } = await supabase
          .from('holding_group_members')
          .insert(members);

        if (membersError) throw membersError;
      }

      return NextResponse.json({ data: holdingGroup }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }
);

