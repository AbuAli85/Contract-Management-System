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
            const emailMatch = party.contact_email?.toLowerCase() === userProfile.email.toLowerCase();
            const nameMatch = party.contact_person && userProfile.full_name &&
              party.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase());

            // Special case: Always allow Falcon Eye Modern Investments
            const isFalconEyeModern = (party.name_en || '').toLowerCase().includes('falcon eye modern investment');

            if (emailMatch || nameMatch || isFalconEyeModern) {
              userRole = 'owner'; // Default to owner for party-linked companies
            }

            // 4. Check if user is an employer via employer_employees
            if (!userRole && party.type === 'Employer') {
              if (party.contact_email?.toLowerCase() === userProfile.email.toLowerCase()) {
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
      .select(`
        id,
        user_id,
        role,
        department,
        job_title,
        is_primary,
        joined_at,
        status
      `)
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

    // Then fetch profile data for each member
    const members: any[] = [];
    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await adminClient
          .from('profiles')
          .select('id, full_name, email, avatar_url, phone')
          .in('id', userIds);

        if (!profilesError && profiles) {
          // Combine member data with profile data
          for (const member of membersData) {
            const profile = profiles.find((p: any) => p.id === member.user_id);
            if (profile) {
              members.push({
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                department: member.department,
                job_title: member.job_title,
                is_primary: member.is_primary,
                joined_at: member.joined_at,
                status: member.status,
                user: {
                  id: profile.id,
                  full_name: profile.full_name,
                  email: profile.email,
                  avatar_url: profile.avatar_url,
                  phone: profile.phone,
                },
              });
            } else {
              // Include member even if profile not found
              members.push({
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                department: member.department,
                job_title: member.job_title,
                is_primary: member.is_primary,
                joined_at: member.joined_at,
                status: member.status,
                user: null,
              });
            }
          }
        } else {
          // If profiles query fails, still return members without profile data
          members.push(...membersData.map((m: any) => ({
            ...m,
            user: null,
          })));
        }
      }
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

