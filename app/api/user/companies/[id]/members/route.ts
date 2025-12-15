import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch company members
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = params.id;

    // Verify user has access to this company
    const { data: myMembership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!myMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all members
    const { data: members, error } = await supabase
      .from('company_members')
      .select(`
        id,
        role,
        department,
        job_title,
        is_primary,
        joined_at,
        status,
        user:profiles (
          id,
          full_name,
          email,
          avatar_url,
          phone
        )
      `)
      .eq('company_id', companyId)
      .neq('status', 'removed')
      .order('role');

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      members: members || [],
      my_role: myMembership.role,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Invite/add a member to the company
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = params.id;
    const body = await request.json();
    const { user_id, email, role, department, job_title } = body;

    // Verify user has admin access
    const { data: myMembership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let targetUserId = user_id;

    // If email provided, find or create user
    if (email && !targetUserId) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        return NextResponse.json({ 
          error: 'User not found. They must create an account first.' 
        }, { status: 404 });
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID or email required' }, { status: 400 });
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('company_members')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('user_id', targetUserId)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }
      // Reactivate
      await supabase
        .from('company_members')
        .update({ status: 'active', role, department, job_title, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Create new membership
      await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: targetUserId,
          role: role || 'member',
          department,
          job_title,
          invited_by: user.id,
          status: 'active',
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Member added successfully',
    });
  } catch (error: any) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

