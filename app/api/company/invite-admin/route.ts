import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface ExistingUser {
  id: string;
  email: string;
  full_name: string | null;
}

interface UserProfile {
  active_company_id: string | null;
}

interface Company {
  name: string;
}

interface InviterProfile {
  full_name: string | null;
  email: string | null;
}

// POST: Invite an external user as admin/manager to the company
export async function POST(request: Request) {
  const supabase = await createClient();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, department, job_title, message } = body;
    
    // Normalize empty strings to null for optional fields
    const normalizedDepartment = department && department.trim() ? department.trim() : null;
    const normalizedJobTitle = job_title && job_title.trim() ? job_title.trim() : null;
    const normalizedMessage = message && message.trim() ? message.trim() : null;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!role || !['admin', 'manager', 'hr', 'accountant', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role',
        message: 'Role must be one of: admin, manager, hr, accountant, member, viewer'
      }, { status: 400 });
    }

    // Get user's active company
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('[Invite Admin] Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const profile = (profileData as any) as UserProfile | null;

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: 'No active company selected' }, { status: 400 });
    }

    const activeCompanyId = profile.active_company_id;

    console.log('[Invite Admin] Adding member to company:', {
      company_id: activeCompanyId,
      inviter_id: user.id,
      inviter_email: user.email,
      target_email: email,
      role,
    });

    // Verify user has owner/admin access using admin client
    const { data: myMembership } = await (supabaseAdmin
      .from('company_members') as any)
      .select('role')
      .eq('company_id', activeCompanyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    // Also check if user owns the company directly
    let canInvite = false;
    if (myMembership && ['owner', 'admin'].includes((myMembership as any).role)) {
      canInvite = true;
    } else {
      const { data: ownedCompany } = await (supabaseAdmin
        .from('companies') as any)
        .select('owner_id')
        .eq('id', activeCompanyId)
        .maybeSingle();
      
      if (ownedCompany && ownedCompany.owner_id === user.id) {
        canInvite = true;
      }
    }

    if (!canInvite) {
      return NextResponse.json({ error: 'Owner or Admin access required' }, { status: 403 });
    }

    // Cannot invite higher role than yourself
    const roleHierarchy = ['owner', 'admin', 'manager', 'hr', 'accountant', 'member', 'viewer'];
    const myRole = (myMembership as any)?.role || 'member';
    const myRoleIndex = roleHierarchy.indexOf(myRole);
    const inviteRoleIndex = roleHierarchy.indexOf(role);
    
    if (inviteRoleIndex < myRoleIndex) {
      return NextResponse.json({ 
        error: 'Cannot invite someone with a higher role than yourself',
        message: `Your role is ${myRole}. You can only invite users with roles: ${roleHierarchy.slice(myRoleIndex + 1).join(', ')}`
      }, { status: 403 });
    }

    // Get company details
    const { data: companyData, error: companyError } = await (supabaseAdmin
      .from('companies') as any)
      .select('name')
      .eq('id', activeCompanyId)
      .maybeSingle();
    
    if (companyError) {
      console.warn('[Invite Admin] Could not fetch company name:', companyError);
    }

    const company = (companyData as any) as Company | null;

    // Get inviter's profile for name
    const { data: inviterProfileData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    
    const inviterProfile = inviterProfileData as InviterProfile | null;
    const inviterName = inviterProfile?.full_name || inviterProfile?.email || user.email || 'Admin';

    // Check if user exists
    const { data: existingUserData } = await (supabaseAdmin
      .from('profiles') as any)
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single();

    const existingUser = existingUserData as ExistingUser | null;

    let targetUserId: string;
    let isNewUser = false;

    if (existingUser) {
      targetUserId = existingUser.id;

      // Check if already a member using admin client
      const { data: existingMembership } = await (supabaseAdmin
        .from('company_members') as any)
        .select('id, status')
        .eq('company_id', activeCompanyId)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingMembership?.status === 'active') {
        return NextResponse.json({ error: 'User is already a member of this company' }, { status: 400 });
      }

      if (existingMembership) {
        // Reactivate
        await (supabaseAdmin
          .from('company_members') as any)
          .update({
            status: 'active',
            role,
            department: normalizedDepartment,
            job_title: normalizedJobTitle,
            invited_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMembership.id);
      } else {
        // Create membership
        const { data: newMembership, error: insertError } = await (supabaseAdmin
          .from('company_members') as any)
          .insert({
            company_id: activeCompanyId,
            user_id: targetUserId,
            role,
            department: normalizedDepartment,
            job_title: normalizedJobTitle,
            invited_by: user.id,
            status: 'active',
          })
          .select('id, company_id, user_id, role, status')
          .single();
        
        if (insertError) {
          console.error('[Invite Admin] Error creating membership:', insertError);
          throw new Error(`Failed to create membership: ${insertError.message}`);
        }
        
        console.log('[Invite Admin] Created new membership:', {
          membership_id: newMembership?.id,
          company_id: newMembership?.company_id,
          user_id: newMembership?.user_id,
          role: newMembership?.role,
          status: newMembership?.status,
          target_email: email,
        });
      }
    } else {
      // User doesn't exist - create an invitation record
      isNewUser = true;

      // For now, we'll create a pending invitation
      // When the user signs up with this email, they'll automatically get access
      const { error: inviteError } = await (supabaseAdmin
          .from('company_members') as any)
          .insert({
            company_id: activeCompanyId,
            user_id: user.id, // Temporarily use inviter's ID
            role,
            department: normalizedDepartment,
            job_title: normalizedJobTitle,
            invited_by: user.id,
            status: 'invited',
            permissions: { pending_email: email.toLowerCase() },
          });

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
      }
    }

    // Queue email notification
    try {
      // Get inviter's user_id for the email queue
      const inviterUserId = user.id;
      
      // Prepare email data with invitation details
      const emailData = {
        company_id: activeCompanyId,
        company_name: (company as any)?.name || 'Company',
        role,
        department: normalizedDepartment,
        job_title: normalizedJobTitle,
        inviter_name: inviterName,
        message: normalizedMessage,
        is_new_user: isNewUser,
        invitation_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/settings/company`,
      };
      
      // Insert into email_queue with correct schema
      const { error: emailQueueError } = await (supabaseAdmin
        .from('email_queue') as any)
        .insert({
          user_id: existingUser?.id || null, // Use target user's ID if exists, otherwise null
          email: email.toLowerCase(),
          template: isNewUser ? 'company_invitation_new_user' : 'company_invitation',
          data: emailData,
          status: 'pending',
          scheduled_for: new Date().toISOString(), // Use scheduled_for, not scheduled_at
          retry_count: 0,
          max_retries: 3,
        });
      
      if (emailQueueError) {
        console.error('Error queuing email:', emailQueueError);
        // Don't fail the entire request if email queue fails
        // The invitation is still created successfully
      } else {
        console.log('Email queued successfully for:', email.toLowerCase());
      }
    } catch (e) {
      console.error('Exception queuing email:', e);
      // Don't fail the entire request if email queue fails
    }

    // Create in-app notification for existing users
    if (existingUser) {
      try {
        await (supabaseAdmin
          .from('notifications') as any)
          .insert({
            user_id: existingUser.id,
            type: 'company_invitation',
            title: `Invited to ${(company as any)?.name || 'Company'}`,
            message: `You've been invited to join ${(company as any)?.name || 'Company'} as ${role}.${normalizedMessage ? ` ${normalizedMessage}` : ''}`,
            priority: 'high',
            action_url: '/en/settings/company',
            action_label: 'View Company',
          });
      } catch (e) {
        console.log('Notification creation failed');
      }
    }

    return NextResponse.json({
      success: true,
      message: isNewUser 
        ? `Invitation sent to ${email}. They will get access when they sign up.`
        : `${existingUser?.full_name || email} has been added to the company as ${role}`,
      is_new_user: isNewUser,
      company_id: activeCompanyId, // Include company_id so frontend knows which company to refresh
      user_id: existingUser?.id || null,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error inviting admin:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
