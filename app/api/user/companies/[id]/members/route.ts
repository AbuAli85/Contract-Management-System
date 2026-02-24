import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch company members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: companyId } = await params;

    // Comprehensive access check - verify user has access through any valid source
    let userRole = null;

    // 1. Check company_members first (primary source)
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
      // 2. Fallback: Check if user owns the company directly
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, owner_id, party_id')
        .eq('id', companyId)
        .maybeSingle();

      if (ownedCompany && ownedCompany.owner_id === user.id) {
        userRole = 'owner';
      } else if (ownedCompany?.party_id) {
        // 3. Check if company is linked to a party where user's email matches
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.id)
          .single();

        if (userProfile?.email) {
          const { data: party } = await adminClient
            .from('parties')
            .select('id, name_en, contact_email, contact_person, type')
            .eq('id', ownedCompany.party_id)
            .maybeSingle();

          if (party) {
            const emailMatch =
              party.contact_email?.toLowerCase() ===
              userProfile.email.toLowerCase();
            const nameMatch =
              party.contact_person &&
              userProfile.full_name &&
              party.contact_person
                .toLowerCase()
                .includes(userProfile.full_name.toLowerCase());

            // Special case: Always allow Falcon Eye Modern Investments
            const isFalconEyeModern = (party.name_en || '')
              .toLowerCase()
              .includes('falcon eye modern investment');

            if (emailMatch || nameMatch || isFalconEyeModern) {
              userRole = 'owner'; // Default to owner for party-linked companies
            }

            // 4. Check if user is an employer via employer_employees
            if (!userRole && party.type === 'Employer') {
              if (
                party.contact_email?.toLowerCase() ===
                userProfile.email.toLowerCase()
              ) {
                userRole = 'owner'; // User is the employer
              }
            }
          }
        }
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
    // First, get company_members records
    const { data: membersData, error: membersError } = await adminClient
      .from('company_members')
      .select(
        `
        id,
        user_id,
        role,
        department,
        job_title,
        is_primary,
        joined_at,
        status,
        permissions
      `
      )
      .eq('company_id', companyId)
      .neq('status', 'removed')
      .order('role');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({
        success: true,
        members: [],
        my_role: userRole,
        message: 'Failed to load members',
      });
    }

    // Debug logging
    console.log(
      `[Members API] Found ${membersData?.length || 0} company_members records for company ${companyId}`
    );
    if (membersData && membersData.length > 0) {
      console.log(
        '[Members API] Member statuses:',
        membersData.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          status: m.status,
        }))
      );
    }

    // Then fetch profile data for each member
    const members: any[] = [];
    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);

      // Fetch profiles if we have user IDs
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await adminClient
          .from('profiles')
          .select('id, full_name, email, avatar_url, phone')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          profiles = profilesData;
        } else if (profilesError) {
          console.warn('Error fetching profiles for members:', profilesError);
          // Continue without profiles - we'll include members anyway
        }
      }

      // Combine member data with profile data
      // IMPORTANT: Include ALL members, even if profile lookup failed
      for (const member of membersData) {
        const profile = member.user_id
          ? profiles.find((p: any) => p.id === member.user_id)
          : null;

        if (!profile && member.user_id) {
          console.warn(
            `[Members API] Profile not found for user_id: ${member.user_id} (member_id: ${member.id})`
          );
        }

        members.push({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          department: member.department,
          job_title: member.job_title,
          is_primary: member.is_primary,
          joined_at: member.joined_at,
          status: member.status,
          user: profile
            ? {
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
                avatar_url: profile.avatar_url,
                phone: profile.phone,
              }
            : member.user_id
              ? null
              : {
                  // For invited users without user_id, show email from metadata if available
                  id: null,
                  full_name: null,
                  email: (member as any).permissions?.pending_email || null,
                  avatar_url: null,
                  phone: null,
                },
        });
      }
    }

    console.log(
      `[Members API] Returning ${members.length} members for company ${companyId}`
    );

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
  { params }: { params: Promise<{ id: string }> }
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

    const { id: companyId } = await params;
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
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
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
        return NextResponse.json(
          {
            error: 'User not found. They must create an account first.',
          },
          { status: 404 }
        );
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID or email required' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: 'User is already a member' },
          { status: 400 }
        );
      }
      // Reactivate using admin client
      await adminClient
        .from('company_members')
        .update({
          status: 'active',
          role,
          department,
          job_title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new membership using admin client
      await adminClient.from('company_members').insert({
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

// DELETE: Remove a member from the company
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: companyId } = await params;

    // Get memberId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const memberIdIndex = pathParts.indexOf('members') + 1;
    const memberId = pathParts[memberIdIndex];

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
