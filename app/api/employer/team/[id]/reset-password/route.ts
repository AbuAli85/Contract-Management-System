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
    let employeeId: string;
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
          { error: 'Access denied. This promoter does not belong to your company.' },
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
            { error: 'Access denied. This employee does not belong to your team.' },
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

      if (fetchError || !employeeRecord) {
        return NextResponse.json(
          { error: 'Employee not found or access denied' },
          { status: 404 }
        );
      }

      employeeId = employeeRecord.employee_id;

      // Get employee email - check profiles first, then promoters
      const { data: profile } = await supabaseAdmin
        .from('profiles' as any)
        .select('email, full_name')
        .eq('id', employeeId)
        .single();

      const { data: promoter } = await supabaseAdmin
        .from('promoters' as any)
        .select('email, name_en')
        .eq('id', employeeId)
        .single();

      employeeEmail = (profile as any)?.email || (promoter as any)?.email;
      employeeName = (profile as any)?.full_name || (promoter as any)?.name_en;
    }

    if (!employeeEmail) {
      return NextResponse.json(
        { error: 'Employee email not found. Please add an email for this employee first.' },
        { status: 400 }
      );
    }

    // Generate new temporary password
    const newPassword = generateTemporaryPassword();

    // ✅ FIX: Find or create auth user, handling email already registered case
    let authUserId: string | null = null;
    
    // Step 1: Try to get auth user by employee ID
    const { data: existingAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(employeeId);
    
    if (!getUserError && existingAuthUser?.user) {
      // Auth user exists with this ID
      authUserId = existingAuthUser.user.id;
      console.log(`✅ Found existing auth user by ID: ${authUserId}`);
    } else {
      // Step 2: Auth user doesn't exist by ID, check if email is registered
      // Find profile by email (profile.id should match auth user id)
      const { data: profileByEmailData } = await supabaseAdmin
        .from('profiles' as any)
        .select('id')
        .eq('email', employeeEmail.toLowerCase())
        .single();

      const profileByEmail = profileByEmailData as { id: string } | null;

      if (profileByEmail?.id) {
        // Profile exists, try to get auth user with profile's ID
        const { data: authUserByProfileId } = await supabaseAdmin.auth.admin.getUserById(profileByEmail.id);
        
        if (authUserByProfileId?.user) {
          authUserId = authUserByProfileId.user.id;
          console.log(`✅ Found existing auth user by email's profile ID: ${authUserId}`);
        }
      }

      // Step 3: If still not found, try to create new auth user
      if (!authUserId) {
        console.log(`Creating auth account for employee ${employeeId} (${employeeEmail})`);
        
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          id: employeeId, // Try to use the same ID as profile/promoter
          email: employeeEmail.toLowerCase(),
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            full_name: employeeName || employeeEmail.split('@')[0],
            role: 'promoter',
            must_change_password: true,
            created_by: user.id,
            created_at: new Date().toISOString(),
          },
        });

        if (createError) {
          // Handle "email already registered" error
          if (createError.message?.includes('already been registered') || 
              createError.message?.includes('already registered') ||
              createError.message?.includes('duplicate key')) {
            
            console.log(`Email ${employeeEmail} already registered, finding correct auth user...`);
            
            // Try to find profile by email and get its auth user
            const { data: existingProfileData } = await supabaseAdmin
              .from('profiles' as any)
              .select('id')
              .eq('email', employeeEmail.toLowerCase())
              .single();
            
            const existingProfile = existingProfileData as { id: string } | null;
            
            if (existingProfile?.id) {
              const { data: foundAuthUser } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
              if (foundAuthUser?.user) {
                authUserId = foundAuthUser.user.id;
                console.log(`✅ Found existing auth user: ${authUserId}`);
              } else {
                return NextResponse.json(
                  { 
                    error: 'Email already registered', 
                    details: 'This email is already registered but the authentication account could not be found. Please contact support.' 
                  },
                  { status: 400 }
                );
              }
            } else {
              return NextResponse.json(
                { 
                  error: 'Email already registered', 
                  details: 'This email is already registered with a different account. Please use the "Invite Employee" feature to properly link the account.' 
                },
                { status: 400 }
              );
            }
          } else {
            // Other creation error
            console.error('Error creating auth user:', createError);
            return NextResponse.json(
              { 
                error: 'Failed to create employee account', 
                details: createError?.message || 'Could not create authentication account.' 
              },
              { status: 500 }
            );
          }
        } else if (newAuthUser?.user) {
          // Successfully created new auth user
          authUserId = newAuthUser.user.id;
          
          // Ensure profile exists and is linked
          await supabaseAdmin.from('profiles').upsert({
            id: authUserId,
            email: employeeEmail.toLowerCase(),
            full_name: employeeName || employeeEmail.split('@')[0],
            role: 'promoter',
            must_change_password: true,
            updated_at: new Date().toISOString(),
          } as any, { onConflict: 'id' });

          console.log(`✅ Auth account created for employee ${authUserId}`);
        }
      }
    }

    // Step 4: Reset password for the found/created auth user
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Could not find or create authentication account' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
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

    console.log(`✅ Password reset for auth user ${authUserId}`);

    // Update profile to require password change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('profiles') as any).update({
      must_change_password: true,
      updated_at: new Date().toISOString(),
    }).eq('id', authUserId);

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

