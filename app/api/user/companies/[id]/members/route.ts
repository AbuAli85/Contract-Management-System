import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch company members
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
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

    const companyId = params.id;

    // Verify user has access to this company
    let userRole = null;
    
    // Check company_members first
    const { data: myMembership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (myMembership) {
      userRole = myMembership.role;
    } else {
      // Fallback: Check if user owns the company directly
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, owner_id')
        .eq('id', companyId)
        .single();
      
      if (ownedCompany && ownedCompany.owner_id === user.id) {
        userRole = 'owner';
      }
    }

    if (!userRole) {
      // Return empty members list instead of 403
      return NextResponse.json({
        success: true,
        members: [],
        my_role: null,
        message: 'No access to this company',
      });
    }

    // Get all members using admin client
    const { data: members, error } = await adminClient
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
      return NextResponse.json({
        success: true,
        members: [],
        my_role: userRole,
        message: 'Failed to load members',
      });
    }

    return NextResponse.json({
      success: true,
      members: members || [],
      my_role: userRole,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      success: true,
      members: [],
      my_role: null,
      message: 'An error occurred',
    });
  }
}

// POST: Invite/add a member to the company
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
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

    const companyId = params.id;
    const body = await request.json();
    const { user_id, email, role, department, job_title } = body;

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
        .single();
      
      if (ownedCompany && ownedCompany.owner_id === user.id) {
        canEdit = true;
      }
    }

    if (!canEdit) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let targetUserId = user_id;

    // If email provided, find or create user
    if (email && !targetUserId) {
      const { data: existingUser } = await adminClient
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

    // Check if already a member using admin client
    const { data: existing } = await adminClient
      .from('company_members')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }
      // Reactivate using admin client
      await adminClient
        .from('company_members')
        .update({ status: 'active', role, department, job_title, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Create new membership using admin client
      await adminClient
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

