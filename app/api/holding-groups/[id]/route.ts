import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac';

// GET /api/holding-groups/[id] - Get a specific holding group with members
export const GET = withRBAC(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = params;

      // Get holding group
      const { data: holdingGroup, error: groupError } = await supabase
        .from('holding_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;

      // Get members
      const { data: members, error: membersError } = await supabase
        .from('holding_group_members')
        .select(`
          *,
          party:parties(id, name_en, name_ar, type, overall_status, contact_email),
          company:companies(id, name, email, is_active)
        `)
        .eq('holding_group_id', id)
        .order('display_order');

      if (membersError) throw membersError;

      return NextResponse.json({
        data: {
          ...holdingGroup,
          members: members || []
        }
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  },
  ['company:read:all', 'party:read:all']
);

// PUT /api/holding-groups/[id] - Update holding group
export const PUT = withRBAC(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = params;
      const body = await request.json();

      const { name_en, name_ar, description, logo_url, is_active } = body;

      const { data: holdingGroup, error } = await supabase
        .from('holding_groups')
        .update({
          name_en,
          name_ar,
          description,
          logo_url,
          is_active,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ data: holdingGroup });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  },
  ['company:manage:all', 'party:manage:all']
);

// DELETE /api/holding-groups/[id] - Delete holding group
export const DELETE = withRBAC(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = params;

      const { error } = await supabase
        .from('holding_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return NextResponse.json({ message: 'Holding group deleted' });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  },
  ['company:manage:all', 'party:manage:all']
);

