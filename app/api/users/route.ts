import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { withRBAC } from '@/lib/rbac/guard';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { assertEntitlement } from '@/lib/billing/entitlements';

// GET - Fetch users in caller's company (tenant-scoped via user_roles)
async function getUsersHandler(request: NextRequest) {
  const supabase = await createClient();
  const { companyId } = await getCompanyRole(supabase);
  if (!companyId) {
    return NextResponse.json({ error: 'No company context' }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Scope by company_id via user_roles (membership table)
  const { data: roleRows, error } = await adminSupabase
    .from('user_roles')
    .select('user_id, role')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = (roleRows ?? []).map((r) => r.user_id).filter(Boolean);
  if (userIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 0, totalPages: 0 },
    });
  }

  const { data: profiles, error: profilesError } = await adminSupabase
    .from('profiles')
    .select('id, email, full_name, role, status, created_at, updated_at')
    .in('id', userIds)
    .order('created_at', { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const roleByUser = new Map((roleRows ?? []).map((r) => [r.user_id, r.role]));
  const users = (profiles ?? []).map((p) => ({
    ...p,
    membership_role: roleByUser.get(p.id) ?? p.role,
  }));

  return NextResponse.json({
    success: true,
    data: users,
    pagination: {
      total: users.length,
      page: 1,
      limit: users.length,
      totalPages: 1,
    },
  });
}

export const GET = withRBAC('users:read:company', getUsersHandler);

// POST - Create new user
async function createUserHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      full_name,
      role,
      status,
      department,
      position,
      phone,
      isSignup,
    } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Enforce subscription plan limits for users
    try {
      // companyId is resolved from the current session/profile
      await assertEntitlement(null, 'users', 1);
    } catch (entitlementError: any) {
      return NextResponse.json(
        {
          error: 'User limit reached for current subscription plan',
          details: entitlementError.message,
        },
        { status: 402 }
      );
    }

    // Create admin client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists
    const { data: existingUser } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Profiles table currently enforces status = pending/approved/active via a check constraint.
    // To keep inserts portable across environments, default every newly created user to 'pending';
    // admins can promote them via the management API once created.
    const normalizedStatus = 'pending';

    // Create auth user using service role
    const generateSecurePassword = (length = 16) => {
      const alphabet =
        'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
      const bytes = randomBytes(length);
      let password = '';
      for (let i = 0; i < length; i++) {
        const byte = bytes[i] ?? 0;
        password += alphabet[byte % alphabet.length];
      }
      return password;
    };

    const generatedPassword = generateSecurePassword(18);

    let authResult;
    let createErrorDetails: string | undefined;
    try {
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: false,
        user_metadata: {
          full_name,
          role: role || 'user',
          status: normalizedStatus,
          department: department || null,
          position: position || null,
          phone: phone || null,
        },
      });

      if (error || !data?.user) {
        throw new Error(error?.message || 'Auth user creation failed');
      }
      authResult = data;
    } catch (authError: any) {
      const message = authError?.message || 'Auth user creation failed';
      if (
        typeof message === 'string' &&
        (message.includes('already registered') ||
          message.includes('duplicate key value'))
      ) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create user', details: message },
        { status: 500 }
      );
    }

    const authUserId = authResult.user.id;

    // Create user profile record
    const { data: newProfile, error: createError } = await adminSupabase
      .from('profiles')
      .insert({
        id: authUserId,
        email,
        full_name,
        role: role || 'user',
        status: normalizedStatus,
      })
      .select()
      .single();

    if (createError) {
      createErrorDetails = createError.message;
      // Roll back auth user so we don't leave orphaned accounts
      await adminSupabase.auth.admin.deleteUser(authUserId);

      if (
        typeof createErrorDetails === 'string' &&
        createErrorDetails.includes('profiles_email_key')
      ) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to create user profile',
          details: createErrorDetails,
        },
        { status: 500 }
      );
    }

    // Send onboarding email with temporary password via Resend
    try {
      const { sendEmail } = await import('@/lib/services/email.service');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      await sendEmail({
        to: email,
        subject: 'Welcome - Your Account Has Been Created',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a1a;">Welcome, ${full_name}!</h2>
            <p>Your account has been created. Use the credentials below to log in:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code>${generatedPassword}</code></p>
            </div>
            <p style="color: #666;">Please change your password after your first login for security.</p>
            ${appUrl ? `<a href="${appUrl}/auth/login" style="background: #0070f3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 8px;">Log In Now</a>` : ''}
          </div>
        `,
      });
    } catch {
      // Do not fail user creation if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully. Temporary password emailed.',
      user: {
        auth: authResult.user,
        profile: newProfile,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export with RBAC protection
export const POST = withRBAC('users:create:company', createUserHandler);
