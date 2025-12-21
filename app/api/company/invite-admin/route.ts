import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
  
  // Use admin client to bypass RLS
  let supabaseAdmin;
  try {
    // Verify service role key is set before creating client
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }
    
    supabaseAdmin = createAdminClient();
    
    // Test the admin client by attempting a simple query
    // This verifies the service role key is valid and can bypass RLS
    const { error: testError } = await supabaseAdmin
      .from('company_members')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42501') {
      throw new Error(`Admin client cannot bypass RLS. Service role key may be invalid. Error: ${testError.message}`);
    }
  } catch (e: any) {
    console.error('[Invite Admin] Admin client initialization or test failed:', {
      message: e.message,
      stack: e.stack,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT_SET',
    });
    return NextResponse.json({ 
      error: 'Server configuration error',
      details: e.message || 'Admin client initialization failed. Please check SUPABASE_SERVICE_ROLE_KEY environment variable.',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hint: 'The SUPABASE_SERVICE_ROLE_KEY must be set in your production environment (Vercel, etc.) and must be a valid service role key from your Supabase dashboard.',
    }, { status: 500 });
  }

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
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', activeCompanyId)
      .maybeSingle();
    
    if (companyError) {
      console.warn('[Invite Admin] Could not fetch company name:', companyError);
    }

    const company = companyData as Company | null;

    // Get inviter's profile for name
    const { data: inviterProfileData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    
    const inviterProfile = inviterProfileData as InviterProfile | null;
    const inviterName = inviterProfile?.full_name || inviterProfile?.email || user.email || 'Admin';

    // Check if user exists
    const { data: existingUserData, error: userCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userCheckError) {
      console.error('[Invite Admin] Error checking for existing user:', userCheckError);
      // Don't fail if user doesn't exist - that's expected for new users
      if (userCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned (expected)
        throw new Error(`Failed to check user existence: ${userCheckError.message}`);
      }
    }

    const existingUser = existingUserData as ExistingUser | null;

    let targetUserId: string;
    let isNewUser = false;

    if (existingUser) {
      targetUserId = existingUser.id;

      // Check if already a member using admin client
      const { data: existingMembership } = await supabaseAdmin
        .from('company_members')
        .select('id, status')
        .eq('company_id', activeCompanyId)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingMembership?.status === 'active') {
        return NextResponse.json({ error: 'User is already a member of this company' }, { status: 400 });
      }

      if (existingMembership) {
        // Reactivate using admin client
        const { error: updateError } = await supabaseAdmin
          .from('company_members')
          .update({
            status: 'active',
            role,
            department: normalizedDepartment,
            job_title: normalizedJobTitle,
            invited_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMembership.id);
        
        if (updateError) {
          console.error('[Invite Admin] Error reactivating membership:', updateError);
          throw new Error(`Failed to reactivate membership: ${updateError.message}`);
        }
      } else {
        // Create membership using admin client (bypasses RLS)
        // Use the same pattern as the working route - insert without select
        const { error: insertError } = await supabaseAdmin
          .from('company_members')
          .insert({
            company_id: activeCompanyId,
            user_id: targetUserId,
            role,
            department: normalizedDepartment,
            job_title: normalizedJobTitle,
            invited_by: user.id,
            status: 'active',
          });
        
        if (insertError) {
          console.error('[Invite Admin] Error creating membership:', {
            error: insertError,
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            company_id: activeCompanyId,
            user_id: targetUserId,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'NOT_SET',
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          });
          
          // Check if it's a permission error and provide more context
          if (insertError.message?.includes('permission denied') || insertError.code === '42501') {
            throw new Error(`Permission denied when inserting into company_members. This usually means the SUPABASE_SERVICE_ROLE_KEY is invalid or the admin client is not properly configured. Original error: ${insertError.message}`);
          }
          
          throw new Error(`Failed to create membership: ${insertError.message}`);
        }
        
        console.log('[Invite Admin] Successfully created membership:', {
          company_id: activeCompanyId,
          user_id: targetUserId,
          role,
          target_email: email,
        });
      }
    } else {
      // User doesn't exist - create an invitation record
      isNewUser = true;

      // For now, we'll create a pending invitation
      // When the user signs up with this email, they'll automatically get access
      const { error: inviteError } = await supabaseAdmin
          .from('company_members')
          .insert({
            company_id: activeCompanyId,
            user_id: null, // No user_id yet, it's an invitation
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
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Invite Admin] Error inviting admin:', {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    
    // Provide more helpful error messages
    let userFriendlyError = errorMessage;
    if (errorMessage.includes('permission denied')) {
      userFriendlyError = 'Permission denied. Please check that SUPABASE_SERVICE_ROLE_KEY is set correctly.';
    } else if (errorMessage.includes('Failed to create membership')) {
      userFriendlyError = 'Failed to add member to company. Please try again or contact support.';
    }
    
    return NextResponse.json({ 
      error: userFriendlyError,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    }, { status: 500 });
  }
}
