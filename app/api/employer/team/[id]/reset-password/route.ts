import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// POST - Reset employee password (employer action)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employerEmployeeId } = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify this employer_employee belongs to the current employer
    const { data: employeeRecord, error: fetchError } = await supabase
      .from('employer_employees')
      .select('id, employee_id, employer_id')
      .eq('id', employerEmployeeId)
      .eq('employer_id', user.id)
      .single();

    if (fetchError || !employeeRecord) {
      return NextResponse.json(
        { error: 'Employee not found or access denied' },
        { status: 404 }
      );
    }

    // Get employee email - check profiles first, then promoters
    const supabaseAdmin = getSupabaseAdmin();
    
    // Try profiles table first
    const { data: profile } = await supabaseAdmin
      .from('profiles' as any)
      .select('email, full_name')
      .eq('id', employeeRecord.employee_id)
      .single();

    // Try promoters table as fallback
    const { data: promoter } = await supabaseAdmin
      .from('promoters' as any)
      .select('email, name_en')
      .eq('id', employeeRecord.employee_id)
      .single();

    const employeeEmail = (profile as any)?.email || (promoter as any)?.email;
    const employeeName = (profile as any)?.full_name || (promoter as any)?.name_en;

    if (!employeeEmail) {
      return NextResponse.json(
        { error: 'Employee email not found. Please add an email for this employee first.' },
        { status: 400 }
      );
    }

    // Generate new temporary password
    const newPassword = generateTemporaryPassword();

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employeeRecord.employee_id,
      {
        password: newPassword,
        user_metadata: {
          must_change_password: true,
        },
      }
    );

    if (updateError) {
      console.error('Error resetting password:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password', details: updateError.message },
        { status: 500 }
      );
    }

    // Update profile to require password change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('profiles') as any).update({
      must_change_password: true,
      updated_at: new Date().toISOString(),
    }).eq('id', employeeRecord.employee_id);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      credentials: {
        email: employeeEmail,
        employee_name: employeeName,
        temporary_password: newPassword,
        login_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/auth/login`,
        note: 'Employee must change password on first login',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/employer/team/[id]/reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTemporaryPassword(): string {
  const length = 12;
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

