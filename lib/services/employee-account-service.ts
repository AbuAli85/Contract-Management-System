/**
 * Employee Account Service
 * 
 * Provides easy-to-use functions for creating and managing employee accounts.
 * Handles all the complexity of auth user creation, profile setup, and promoter records.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface CreateEmployeeAccountOptions {
  email: string;
  fullName: string;
  phone?: string | null;
  employeeId?: string; // Optional: specific ID to use (e.g., from promoter record)
  invitedBy?: string; // ID of the employer/admin who invited
  role?: string; // Default: 'promoter'
}

export interface EmployeeAccountResult {
  success: boolean;
  authUserId: string | null;
  isNewUser: boolean;
  temporaryPassword: string | null;
  error?: string;
  errorDetails?: string;
}

/**
 * Ensure user has the 'promoter' role assigned
 * This grants them promoter:read:own and other promoter permissions
 */
async function ensurePromoterRole(userId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Get the promoter role ID
    const { data: promoterRoleData } = await supabaseAdmin
      .from('roles' as any)
      .select('id')
      .eq('name', 'promoter')
      .single();

    const promoterRole = promoterRoleData as { id: string } | null;

    if (promoterRole?.id) {
      // Check if role is already assigned
      const { data: existingAssignmentData } = await supabaseAdmin
        .from('user_role_assignments' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', promoterRole.id)
        .eq('is_active', true)
        .maybeSingle();

      const existingAssignment = existingAssignmentData as { id: string } | null;

      if (!existingAssignment) {
        // Assign the role to the user
        await supabaseAdmin.from('user_role_assignments' as any).upsert({
          user_id: userId,
          role_id: promoterRole.id,
          is_active: true,
          valid_from: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id,role_id' });

        console.log(`✅ Assigned 'promoter' role to user ${userId}`);
      }
    } else {
      console.warn(`⚠️ 'promoter' role not found in roles table. User may need manual role assignment.`);
    }
  } catch (roleError) {
    // Non-critical: log but don't fail
    console.error('Error ensuring promoter role (non-critical):', roleError);
  }
}

/**
 * Generate a secure temporary password
 */
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

/**
 * Find or create an employee auth account
 * 
 * This function handles all the complexity:
 * - Checks if auth user exists by ID
 * - Checks if auth user exists by email
 * - Creates new auth user if needed
 * - Handles "email already registered" errors gracefully
 * 
 * @param options - Employee account creation options
 * @returns Result with auth user ID and temporary password (if new user)
 */
export async function findOrCreateEmployeeAccount(
  options: CreateEmployeeAccountOptions
): Promise<EmployeeAccountResult> {
  const {
    email,
    fullName,
    phone,
    employeeId,
    invitedBy,
    role = 'promoter',
  } = options;

  const supabaseAdmin = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase().trim();

  // Step 1: Try to find existing auth user by employee ID (if provided)
  if (employeeId) {
    const { data: existingAuthUser, error: getUserError } = 
      await supabaseAdmin.auth.admin.getUserById(employeeId);
    
    if (!getUserError && existingAuthUser?.user) {
      // Ensure role is assigned even for existing users
      await ensurePromoterRole(existingAuthUser.user.id);
      
      return {
        success: true,
        authUserId: existingAuthUser.user.id,
        isNewUser: false,
        temporaryPassword: null,
      };
    }
  }

  // Step 2: Try to find existing auth user by email
  // Check profiles table first (profile.id should match auth user id)
  const { data: profileByEmailData } = await supabaseAdmin
    .from('profiles' as any)
    .select('id')
    .eq('email', normalizedEmail)
    .single();

  const profileByEmail = profileByEmailData as { id: string } | null;

  if (profileByEmail?.id) {
    const profileId = profileByEmail.id;
    const { data: authUserByEmail } = 
      await supabaseAdmin.auth.admin.getUserById(profileId);
    
    if (authUserByEmail?.user) {
      // Ensure role is assigned even for existing users
      await ensurePromoterRole(authUserByEmail.user.id);
      
      return {
        success: true,
        authUserId: authUserByEmail.user.id,
        isNewUser: false,
        temporaryPassword: null,
      };
    }
  }

  // Step 3: Create new auth user
  const temporaryPassword = generateTemporaryPassword();
  
  try {
    const { data: newAuthUser, error: createError } = 
      await supabaseAdmin.auth.admin.createUser({
        id: employeeId, // Try to use provided ID if available
        email: normalizedEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: role,
          must_change_password: true,
          ...(invitedBy && { invited_by: invitedBy }),
          ...(invitedBy && { invited_at: new Date().toISOString() }),
        },
      });

    if (createError) {
      // Handle "email already registered" error
      if (
        createError.message?.includes('already been registered') ||
        createError.message?.includes('already registered') ||
        createError.message?.includes('duplicate key')
      ) {
        // Email is registered, try to find the correct auth user
        const { data: existingProfileData } = await supabaseAdmin
          .from('profiles' as any)
          .select('id')
          .eq('email', normalizedEmail)
          .single();

        const existingProfile = existingProfileData as { id: string } | null;

        if (existingProfile?.id) {
          const profileId = existingProfile.id;
          const { data: foundAuthUser } = 
            await supabaseAdmin.auth.admin.getUserById(profileId);
          
          if (foundAuthUser?.user) {
            return {
              success: true,
              authUserId: foundAuthUser.user.id,
              isNewUser: false,
              temporaryPassword: null,
            };
          }
        }

        return {
          success: false,
          authUserId: null,
          isNewUser: false,
          temporaryPassword: null,
          error: 'Email already registered',
          errorDetails: 'This email is already registered with a different account. Please use the "Invite Employee" feature to properly link the account.',
        };
      }

      // Other creation error
      return {
        success: false,
        authUserId: null,
        isNewUser: false,
        temporaryPassword: null,
        error: 'Failed to create account',
        errorDetails: createError.message || 'Could not create authentication account.',
      };
    }

    if (!newAuthUser?.user) {
      return {
        success: false,
        authUserId: null,
        isNewUser: false,
        temporaryPassword: null,
        error: 'Failed to create account',
        errorDetails: 'Auth user creation returned no user data.',
      };
    }

    const authUserId = newAuthUser.user.id;

    // Step 4: Create/update profile
    await supabaseAdmin.from('profiles').upsert({
      id: authUserId,
      email: normalizedEmail,
      full_name: fullName,
      role: role,
      phone: phone || null,
      must_change_password: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'id' });

    // Step 5: Create/update promoter record
    await supabaseAdmin.from('promoters').upsert({
      id: authUserId,
      email: normalizedEmail,
      name_en: fullName,
      name_ar: fullName,
      phone: phone || null,
      status: 'active',
      ...(invitedBy && { created_by: invitedBy }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'id' });

    // Step 6: Assign 'promoter' role to grant permissions (promoter:read:own, etc.)
    await ensurePromoterRole(authUserId);

    return {
      success: true,
      authUserId: authUserId,
      isNewUser: true,
      temporaryPassword: temporaryPassword,
    };
  } catch (error: any) {
    console.error('Error in findOrCreateEmployeeAccount:', error);
    return {
      success: false,
      authUserId: null,
      isNewUser: false,
      temporaryPassword: null,
      error: 'Unexpected error',
      errorDetails: error?.message || 'An unexpected error occurred while creating the account.',
    };
  }
}

/**
 * Reset password for an employee account
 * 
 * @param authUserId - The auth user ID
 * @param newPassword - Optional: new password (if not provided, generates one)
 * @returns Result with new password if generated
 */
export async function resetEmployeePassword(
  authUserId: string,
  newPassword?: string
): Promise<{ success: boolean; password: string | null; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();
  const password = newPassword || generateTemporaryPassword();

  try {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        password: password,
        user_metadata: {
          must_change_password: true,
        },
      }
    );

    if (updateError) {
      return {
        success: false,
        password: null,
        error: updateError.message || 'Failed to reset password',
      };
    }

    // Update profile to require password change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('profiles') as any).update({
      must_change_password: true,
      updated_at: new Date().toISOString(),
    }).eq('id', authUserId);

    return {
      success: true,
      password: password,
    };
  } catch (error: any) {
    console.error('Error in resetEmployeePassword:', error);
    return {
      success: false,
      password: null,
      error: error?.message || 'An unexpected error occurred while resetting the password.',
    };
  }
}

