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
    const {
      email,
      full_name,
      phone,
      job_title,
      department,
      employment_type,
    } = body;

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

    const isEmployer = profile?.role === 'employer' || 
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
    
    const existingUsers = existingUsersRaw as Array<{ id: string; email: string; full_name: string }> | null;

    let employeeUserId: string;
    let isNewUser = false;
    let temporaryPassword: string | null = null;

    const firstUser = existingUsers?.[0];
    if (firstUser) {
      // User exists - just add to team
      employeeUserId = firstUser.id;
      
      // Update their employer_id in promoters table
      const { error: updatePromoterError } = await (supabaseAdmin.from('promoters') as any).update({
        employer_id: user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', employeeUserId);

      if (updatePromoterError) {
        console.error('Error updating promoter employer_id:', updatePromoterError);
        // Continue anyway - the employer_employees link will still be created
      }
    } else {
      // Create new user account
      isNewUser = true;
      
      // Generate a temporary password
      temporaryPassword = generateTemporaryPassword();

      // Create the auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: full_name,
          role: 'promoter',
          must_change_password: true,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        },
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create employee account', details: createError?.message },
          { status: 500 }
        );
      }

      employeeUserId = newUser.user.id;

      // Create profile for the new user
      await supabaseAdmin.from('profiles').upsert({
        id: employeeUserId,
        email: email.toLowerCase(),
        full_name: full_name,
        role: 'promoter',
        phone: phone || null,
        must_change_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      // Also create a promoter record with employer_id
      await supabaseAdmin.from('promoters').upsert({
        id: employeeUserId,
        email: email.toLowerCase(),
        name_en: full_name,
        name_ar: full_name,
        phone: phone || null,
        status: 'active',
        employer_id: user.id,  // Link to the employer who invited them
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);
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
        { error: 'Failed to add employee to team', details: insertError.message },
        { status: 500 }
      );
    }

    // TODO: Send email notification to the employee
    // For now, we return the temporary password for the employer to share

    return NextResponse.json({
      success: true,
      message: isNewUser 
        ? 'Employee account created and added to team' 
        : 'Existing user added to team',
      team_member: teamMember,
      is_new_user: isNewUser,
      // Only return credentials for new users (employer should share these securely)
      credentials: isNewUser ? {
        email: email.toLowerCase(),
        temporary_password: temporaryPassword,
        login_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/auth/login`,
        note: 'Employee must change password on first login',
      } : null,
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
  return password.split('').sort(() => Math.random() - 0.5).join('');
}


