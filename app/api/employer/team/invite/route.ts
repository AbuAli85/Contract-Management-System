import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Invite/Create an employee account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, full_name, phone, job_title, department, employment_type } =
      body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if employer has permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isEmployer =
      profile?.role === 'employer' ||
      profile?.role === 'admin' ||
      profile?.role === 'manager';

    if (!isEmployer) {
      return NextResponse.json(
        { error: 'Only employers can invite employees' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if user already exists
    const { data: existingUsersRaw } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .limit(1);

    const existingUsers = existingUsersRaw as Array<{
      id: string;
      email: string;
      full_name: string;
    }> | null;

    let employeeUserId: string;
    let isNewUser = false;
    let temporaryPassword: string | null = null;

    const firstUser = existingUsers?.[0];
    if (firstUser) {
      // User exists - just add to team
      employeeUserId = firstUser.id;

      // Upsert promoter record (in case user exists in profiles but not in promoters)
      // Note: employer_id references parties table, so we don't set it here
      // The employer-employee link is managed via employer_employees table
      const { error: upsertPromoterError } = await supabaseAdmin
        .from('promoters')
        .upsert(
          {
            id: employeeUserId,
            email: email.toLowerCase(),
            name_en: full_name,
            name_ar: full_name,
            status: 'active',
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'id' }
        );

      if (upsertPromoterError) {
        console.error('Error upserting promoter:', upsertPromoterError);
        return NextResponse.json(
          {
            error: 'Failed to link employee record',
            details: upsertPromoterError.message,
          },
          { status: 500 }
        );
      }
    } else {
      // Create new user account
      isNewUser = true;

      // Generate a temporary password
      temporaryPassword = generateTemporaryPassword();

      // Create the auth user
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase(),
          password: temporaryPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name,
            role: 'promoter',
            must_change_password: true,
            invited_by: user.id,
            invited_at: new Date().toISOString(),
          },
        });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          {
            error: 'Failed to create employee account',
            details: createError?.message,
          },
          { status: 500 }
        );
      }

      employeeUserId = newUser.user.id;

      // Create profile for the new user
      await supabaseAdmin.from('profiles').upsert({
        id: employeeUserId,
        email: email.toLowerCase(),
        full_name,
        role: 'promoter',
        phone: phone || null,
        must_change_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      // Also create a promoter record
      // Note: employer_id references parties table, not profiles
      // The employer-employee link is managed via employer_employees table
      const { error: promoterError } = await supabaseAdmin
        .from('promoters')
        .upsert({
          id: employeeUserId,
          email: email.toLowerCase(),
          name_en: full_name,
          name_ar: full_name,
          phone: phone || null,
          status: 'active',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);

      if (promoterError) {
        console.error('Error creating promoter record:', promoterError);
        return NextResponse.json(
          {
            error: 'Failed to create employee record',
            details: promoterError.message,
          },
          { status: 500 }
        );
      }
    }

    // Check if already in team
    const { data: existing } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employer_id', user.id)
      .eq('employee_id', employeeUserId)
      .eq('employment_status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This person is already in your team' },
        { status: 400 }
      );
    }

    // Add to team
    const { data: teamMember, error: insertError } = await supabaseAdmin
      .from('employer_employees')
      .insert({
        employer_id: user.id,
        employee_id: employeeUserId,
        job_title: job_title || null,
        department: department || null,
        employment_type: employment_type || 'full_time',
        employment_status: 'active',
        hire_date: new Date().toISOString().split('T')[0],
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('Error adding to team:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to add employee to team',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Send email notification to the employee
    try {
      const { UnifiedNotificationService } =
        await import('@/lib/services/unified-notification.service');
      const notificationService = new UnifiedNotificationService();

      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/auth/login`;

      if (isNewUser && temporaryPassword) {
        // Send welcome email with credentials for new users
        await notificationService.sendNotification({
          recipients: [
            {
              email: email.toLowerCase(),
              name: full_name,
            },
          ],
          content: {
            title: 'Welcome to the Team!',
            message: `You've been added to the team. Your account has been created.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to the Team!</h2>
                <p>Dear ${full_name},</p>
                <p>You've been added to the team. Your account has been created with the following credentials:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Email:</strong> ${email.toLowerCase()}</p>
                  <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
                  <p style="color: #dc2626; font-size: 14px;"><strong>⚠️ Important:</strong> You must change your password on first login.</p>
                </div>
                <p><strong>Job Title:</strong> ${job_title || 'Not specified'}</p>
                ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
                <p style="margin-top: 24px;">
                  <a href="${loginUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Login to Your Account
                  </a>
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                  If you have any questions, please contact your manager or HR department.
                </p>
              </div>
            `,
            priority: 'high',
            actionUrl: loginUrl,
          },
          channels: ['email'],
          sendImmediately: true,
        });
      } else {
        // Send notification for existing users
        await notificationService.sendNotification({
          recipients: [
            {
              email: email.toLowerCase(),
              name: full_name,
            },
          ],
          content: {
            title: "You've Been Added to a Team",
            message: `You've been added to a new team.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Team Assignment</h2>
                <p>Dear ${full_name},</p>
                <p>You've been added to a new team with the following details:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Job Title:</strong> ${job_title || 'Not specified'}</p>
                  ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
                  <p><strong>Employment Type:</strong> ${employment_type || 'Full Time'}</p>
                </div>
                <p style="margin-top: 24px;">
                  <a href="${loginUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Your Dashboard
                  </a>
                </p>
              </div>
            `,
            priority: 'medium',
            actionUrl: loginUrl,
          },
          channels: ['email'],
          sendImmediately: true,
        });
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('Failed to send email notification:', emailError);
      // Continue with response - email failure shouldn't block team addition
    }

    return NextResponse.json({
      success: true,
      message: isNewUser
        ? 'Employee account created and added to team. Email notification sent.'
        : 'Existing user added to team. Email notification sent.',
      team_member: teamMember,
      is_new_user: isNewUser,
      // Only return credentials for new users (as backup if email fails)
      credentials: isNewUser
        ? {
            email: email.toLowerCase(),
            temporary_password: temporaryPassword,
            login_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/auth/login`,
            note: 'Employee must change password on first login. Email notification has been sent.',
          }
        : null,
    });
  } catch (error) {
    console.error('Error in POST /api/employer/team/invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a secure temporary password
function generateTemporaryPassword(): string {
  const length = 12;
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%';

  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
