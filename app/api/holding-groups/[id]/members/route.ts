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

      // Validation
      if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
        return NextResponse.json(
          { error: 'member_ids must be a non-empty array' },
          { status: 400 }
        );
      }

      if (!member_type || !['party', 'company'].includes(member_type)) {
        return NextResponse.json(
          { error: 'member_type must be either "party" or "company"' },
          { status: 400 }
        );
      }

      // Check if holding group exists
      const { data: holdingGroup, error: groupError } = await supabase
        .from('holding_groups')
        .select('id')
        .eq('id', id)
        .single();

      if (groupError || !holdingGroup) {
        return NextResponse.json(
          { error: 'Holding group not found' },
          { status: 404 }
        );
      }

      // Check for existing members in THIS holding group to avoid duplicates
      const { data: existingMembers, error: existingError } = await supabase
        .from('holding_group_members')
        .select('party_id, company_id')
        .eq('holding_group_id', id);

      if (existingError) {
        console.error('[HoldingGroupMembers] Error checking existing members:', existingError);
      }

      const existingIds = new Set(
        (existingMembers || []).map((m: any) => 
          member_type === 'party' ? m.party_id : m.company_id
        ).filter(Boolean)
      );

      // Filter out already existing members
      const newMemberIds = member_ids.filter((id: string) => !existingIds.has(id));

      if (newMemberIds.length === 0) {
        return NextResponse.json(
          { error: 'All selected members are already in this holding group' },
          { status: 400 }
        );
      }

      // Prepare members for insertion
      const members = newMemberIds.map((memberId: string, index: number) => ({
        holding_group_id: id,
        party_id: member_type === 'party' ? memberId : null,
        company_id: member_type === 'company' ? memberId : null,
        member_type,
        display_order: index,
        created_by: user.id,
      }));

      // Insert members one by one to handle constraint violations gracefully
      const insertedMembers = [];
      const errors = [];

      for (const member of members) {
        const { data, error } = await supabase
          .from('holding_group_members')
          .insert(member)
          .select(`
            *,
            party:parties(id, name_en, name_ar, type, overall_status),
            company:companies(id, name, email, is_active)
          `)
          .single();

        if (error) {
          // Check if it's a unique constraint violation (already exists)
          if (error.code === '23505' || error.message.includes('unique')) {
            console.warn(`Member ${member.party_id || member.company_id} already exists, skipping`);
            continue;
          }
          errors.push({ memberId: member.party_id || member.company_id, error: error.message });
        } else if (data) {
          insertedMembers.push(data);
        }
      }

      if (errors.length > 0 && insertedMembers.length === 0) {
        return NextResponse.json(
          { 
            error: 'Failed to add members',
            details: errors 
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        data: insertedMembers,
        message: `Successfully added ${insertedMembers.length} member(s)`,
        skipped: member_ids.length - insertedMembers.length
      }, { status: 201 });
    } catch (error: any) {
      console.error('[HoldingGroupMembers] POST error:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
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

