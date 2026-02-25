import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  findOrCreateEmployeeAccount,
  resetEmployeePassword,
  ensurePromoterRole,
} from '@/lib/services/employee-account-service';

export const dynamic = 'force-dynamic';

// POST - Reset employee password (employer action)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inputId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let employeeId: string = '';
    let employeeEmail: string | null = null;
    let employeeName: string | null = null;

    // ✅ FIX: Handle both employer_employee IDs and promoter_ prefixed IDs
    if (inputId.startsWith('promoter_')) {
      // Extract promoter ID from the prefixed format
      const promoterId = inputId.replace('promoter_', '');

      // Get employer's party_id to verify ownership
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id, email')
        .eq('id', user.id)
        .single();

      let partyId: string | null = null;
      if (profile?.active_company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('party_id')
          .eq('id', profile.active_company_id)
          .single();
        partyId = company?.party_id || null;
      }

      // Verify promoter belongs to this employer
      const { data: promoterData, error: promoterError } = await supabaseAdmin
        .from('promoters' as any)
        .select('id, email, name_en, name_ar, employer_id')
        .eq('id', promoterId)
        .single();

      if (promoterError || !promoterData) {
        return NextResponse.json(
          { error: 'Promoter not found' },
          { status: 404 }
        );
      }

      // Type assertion for promoter data
      const promoter = promoterData as {
        id: string;
        email: string | null;
        name_en: string | null;
        name_ar: string | null;
        employer_id: string | null;
      };

      // Verify ownership: promoter.employer_id should match employer's party_id
      if (partyId && promoter.employer_id !== partyId) {
        return NextResponse.json(
          {
            error:
              'Access denied. This promoter does not belong to your company.',
          },
          { status: 403 }
        );
      }

      // Also check if employer_id matches user's profile (fallback)
      if (!partyId) {
        // Try to find employer_employee record to verify ownership
        const { data: employerEmployee } = await supabase
          .from('employer_employees')
          .select('id, employer_id')
          .eq('employee_id', promoterId)
          .eq('employer_id', user.id)
          .single();

        if (!employerEmployee) {
          return NextResponse.json(
            {
              error:
                'Access denied. This employee does not belong to your team.',
            },
            { status: 403 }
          );
        }
      }

      employeeId = promoterId;
      employeeEmail = promoter.email;
      employeeName = promoter.name_en || promoter.name_ar || null;
    } else {
      // Regular employer_employee ID
      const { data: employeeRecord, error: fetchError } = await supabase
        .from('employer_employees')
        .select('id, employee_id, employer_id')
        .eq('id', inputId)
        .eq('employer_id', user.id)
        .single();

      if (fetchError || !employeeRecord || !employeeRecord.employee_id) {
        return NextResponse.json(
          { error: 'Employee not found or access denied' },
          { status: 404 }
        );
      }

      // TypeScript: employee_id is guaranteed to exist after the check above
      const recordEmployeeId: string = employeeRecord.employee_id as string;
      employeeId = recordEmployeeId;

      // Get employee email - check profiles first, then promoters
      const { data: profile } = await supabaseAdmin
        .from('profiles' as any)
        .select('email, full_name')
        .eq('id', recordEmployeeId)
        .single();

      const { data: promoter } = await supabaseAdmin
        .from('promoters' as any)
        .select('email, name_en')
        .eq('id', recordEmployeeId)
        .single();

      employeeEmail = (profile as any)?.email || (promoter as any)?.email;
      employeeName = (profile as any)?.full_name || (promoter as any)?.name_en;
    }

    // Validate required fields
    if (!employeeEmail) {
      return NextResponse.json(
        {
          error:
            'Employee email not found. Please add an email for this employee first.',
        },
        { status: 400 }
      );
    }

    // At this point, employeeId is guaranteed to be set (either from promoter or employer_employee)
    // TypeScript doesn't narrow properly, so we validate and use type assertion
    if (!employeeId || employeeId === '') {
      return NextResponse.json(
        { error: 'Employee ID not found' },
        { status: 400 }
      );
    }

    // Type assertion: employeeId is guaranteed to be a non-empty string at this point
    // After the check above, TypeScript should know it's a string, but we assert to be safe
    const finalEmployeeId = employeeId as string;

    // ✅ EASY WAY: Use the employee account service to find or create account
    // employeeEmail is guaranteed to be non-null after the check above
    const emailParts = employeeEmail!.split('@');
    const defaultName = emailParts[0] || 'Employee';
    const finalEmployeeName: string = employeeName || defaultName;
    const accountResult = await findOrCreateEmployeeAccount({
      email: employeeEmail, // TypeScript knows it's non-null after the check
      fullName: finalEmployeeName,
      phone: null,
      employeeId: finalEmployeeId,
      invitedBy: user.id,
      role: 'promoter',
    });

    if (!accountResult.success || !accountResult.authUserId) {
      return NextResponse.json(
        {
          error:
            accountResult.error || 'Failed to find or create employee account',
          details: accountResult.errorDetails,
        },
        {
          status:
            accountResult.error === 'Email already registered' ? 400 : 500,
        }
      );
    }

    const authUserId = accountResult.authUserId;

    // Reset password for the account
    const passwordResult = await resetEmployeePassword(authUserId);

    if (!passwordResult.success || !passwordResult.password) {
      return NextResponse.json(
        {
          error: passwordResult.error || 'Failed to reset password',
          details: 'Could not reset the password for this account.',
        },
        { status: 500 }
      );
    }

    const newPassword = passwordResult.password!; // Password is guaranteed to exist if success is true

    // ✅ Ensure the user has the 'promoter' role for permissions
    await ensurePromoterRole(authUserId);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      credentials: {
        email: employeeEmail,
        employee_name: employeeName,
        temporary_password: newPassword,
        login_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en'}/auth/login`,
        note: 'Employee must change password on first login',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
