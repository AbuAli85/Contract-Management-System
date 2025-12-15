import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface ExistingUser {
  id: string;
  email: string;
  full_name: string | null;
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

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!role || !['admin', 'manager', 'hr', 'accountant', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: 'No active company selected' }, { status: 400 });
    }

    // Verify user has owner/admin access
    const { data: myMembership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
      return NextResponse.json({ error: 'Owner or Admin access required' }, { status: 403 });
    }

    // Cannot invite higher role than yourself
    const roleHierarchy = ['owner', 'admin', 'manager', 'hr', 'accountant', 'member', 'viewer'];
    const myRoleIndex = roleHierarchy.indexOf(myMembership.role);
    const inviteRoleIndex = roleHierarchy.indexOf(role);
    
    if (inviteRoleIndex < myRoleIndex) {
      return NextResponse.json({ 
        error: 'Cannot invite someone with a higher role than yourself' 
      }, { status: 403 });
    }

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.active_company_id)
      .single();

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

      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('company_members')
        .select('id, status')
        .eq('company_id', profile.active_company_id)
        .eq('user_id', targetUserId)
        .single();

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
            department,
            job_title,
            invited_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMembership.id);
      } else {
        // Create membership
        await (supabaseAdmin
          .from('company_members') as any)
          .insert({
            company_id: profile.active_company_id,
            user_id: targetUserId,
            role,
            department,
            job_title,
            invited_by: user.id,
            status: 'active',
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
          company_id: profile.active_company_id,
          user_id: user.id, // Temporarily use inviter's ID
          role,
          department,
          job_title,
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
      await (supabaseAdmin
        .from('email_queue') as any)
        .insert({
          email_address: email.toLowerCase(),
          notification_type: isNewUser ? 'company_invitation_new_user' : 'company_invitation',
          priority: 1,
          scheduled_at: new Date().toISOString(),
          status: 'pending',
        });
    } catch (e) {
      console.log('Email queue not available');
    }

    // Create in-app notification for existing users
    if (existingUser) {
      try {
        await (supabaseAdmin
          .from('notifications') as any)
          .insert({
            user_id: existingUser.id,
            type: 'company_invitation',
            title: `Invited to ${company?.name}`,
            message: `You've been invited to join ${company?.name} as ${role}. ${message || ''}`,
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
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error inviting admin:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
