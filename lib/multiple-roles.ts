import { createClient } from '@/lib/supabase/client';

// Multiple roles system - users can have multiple independent roles
export const AVAILABLE_ROLES = [
  'super_admin',
  'admin',
  'manager',
  'moderator',
  'user',
  'guest',
  'finance_admin',
  'hr_admin',
  'content_manager',
  'analyst',
] as const;

export type MultipleUserRole = (typeof AVAILABLE_ROLES)[number];

/**
 * Check if user has a specific role
 * @param userRoles - Array of user's roles
 * @param requiredRole - Required role for the action
 * @returns boolean
 */
export function hasSpecificRole(
  userRoles: string[],
  requiredRole: string
): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check if user has any of the required roles
 * @param userRoles - Array of user's roles
 * @param requiredRoles - Array of required roles (user needs at least one)
 * @returns boolean
 */
export function hasAnyRole(
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if user has all required roles
 * @param userRoles - Array of user's roles
 * @param requiredRoles - Array of required roles (user needs all)
 * @returns boolean
 */
export function hasAllRoles(
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Check if user can perform admin actions
 * @param userRoles - Array of user's roles
 * @returns boolean
 */
export function canPerformAdminActions(userRoles: string[]): boolean {
  return hasAnyRole(userRoles, [
    'super_admin',
    'admin',
    'finance_admin',
    'hr_admin',
  ]);
}

/**
 * Check if user can perform user actions
 * @param userRoles - Array of user's roles
 * @returns boolean
 */
export function canPerformUserActions(userRoles: string[]): boolean {
  return hasAnyRole(userRoles, ['user', 'admin', 'manager', 'moderator']);
}

/**
 * Get role display for multiple roles
 * @param userRoles - Array of user's roles
 * @returns object with display info
 */
export function getMultipleRoleDisplay(userRoles: string[]) {
  const isAdmin = canPerformAdminActions(userRoles);
  const isUser = canPerformUserActions(userRoles);

  // Sort roles by importance
  const sortedRoles = userRoles.sort((a, b) => {
    const order = ['super_admin', 'admin', 'manager', 'moderator', 'user'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const primaryRole = sortedRoles[0] || 'user';

  return {
    primary: primaryRole,
    all: userRoles,
    displayText:
      isAdmin && isUser
        ? `${primaryRole} + ${userRoles.length - 1} more`
        : userRoles.join(', '),
    badges: userRoles,
    canDoAdmin: isAdmin,
    canDoUser: isUser,
    roleCount: userRoles.length,
  };
}

/**
 * Add role to user
 * @param userId - User ID
 * @param newRole - Role to add
 * @returns Promise with result
 */
export async function addRoleToUser(userId: string, newRole: MultipleUserRole) {
  const supabase = createClient();

  try {
    // First get current roles
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentRoles = user?.roles || [];

    // Add new role if not already present
    if (!currentRoles.includes(newRole)) {
      const updatedRoles = [...currentRoles, newRole];

      const { data, error } = await supabase
        .from('users')
        .update({ roles: updatedRoles })
        .eq('id', userId)
        .select();

      if (error) throw error;

      return { success: true, data };
    }

    return { success: true, data: user, message: 'Role already assigned' };
  } catch (error) {
    console.error('Error adding role to user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove role from user
 * @param userId - User ID
 * @param roleToRemove - Role to remove
 * @returns Promise with result
 */
export async function removeRoleFromUser(userId: string, roleToRemove: string) {
  const supabase = createClient();

  try {
    // Get current roles
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentRoles = user?.roles || [];
    const updatedRoles = currentRoles.filter(
      (role: string) => role !== roleToRemove
    );

    const { data, error } = await supabase
      .from('users')
      .update({ roles: updatedRoles })
      .eq('id', userId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error removing role from user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
