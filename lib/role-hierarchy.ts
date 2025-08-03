import { createClient } from '@/lib/supabase/client'

// Role hierarchy system - higher roles inherit all lower role permissions
export const ROLE_HIERARCHY = {
  'super_admin': 5,  // Highest level - can do everything
  'admin': 4,        // Can manage users, system settings
  'manager': 3,      // Can manage teams, promoters
  'moderator': 2,    // Can moderate content, basic admin tasks  
  'user': 1,         // Basic user permissions
  'guest': 0         // Lowest level - read-only
} as const

export type UserRole = keyof typeof ROLE_HIERARCHY

/**
 * Check if user has permission for a specific role level
 * @param userRole - Current user's role
 * @param requiredRole - Required role for the action
 * @returns boolean - true if user has permission
 */
export function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole as UserRole] ?? 0
  
  return userLevel >= requiredLevel
}

/**
 * Get all roles that this user can access
 * @param userRole - Current user's role
 * @returns Array of role names the user can access
 */
export function getAccessibleRoles(userRole: string): string[] {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0
  
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => userLevel >= level)
    .map(([role]) => role)
}

/**
 * Check if user can perform admin actions
 * @param userRole - Current user's role
 * @returns boolean
 */
export function canPerformAdminActions(userRole: string): boolean {
  return hasRolePermission(userRole, 'admin')
}

/**
 * Check if user can perform user actions (basically everyone except guests)
 * @param userRole - Current user's role
 * @returns boolean
 */
export function canPerformUserActions(userRole: string): boolean {
  return hasRolePermission(userRole, 'user')
}

/**
 * Get role display with inheritance indication
 * @param userRole - Current user's role
 * @returns object with display info
 */
export function getRoleDisplay(userRole: string) {
  const accessibleRoles = getAccessibleRoles(userRole)
  const isAdmin = canPerformAdminActions(userRole)
  const isUser = canPerformUserActions(userRole)
  
  // Determine the best display name for the role
  let displayText = userRole
  if (userRole === 'super_admin') {
    displayText = 'Super Admin'
  } else if (userRole === 'admin') {
    displayText = 'Admin'
  } else if (userRole === 'manager') {
    displayText = 'Manager'
  } else if (userRole === 'moderator') {
    displayText = 'Moderator'
  } else if (userRole === 'user') {
    displayText = 'User'
  } else if (userRole === 'guest') {
    displayText = 'Guest'
  }
  
  return {
    primary: userRole,
    accessible: accessibleRoles,
    displayText: displayText, // Show only the primary role name
    badges: [], // No additional badges, just the primary role
    canDoAdmin: isAdmin,
    canDoUser: isUser
  }
}

/**
 * Update user role in database
 * @param userId - User ID to update
 * @param newRole - New role to assign
 * @returns Promise with result
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get users with their role hierarchy information
 * @returns Promise with users and their role capabilities
 */
export async function getUsersWithRoleInfo() {
  const supabase = createClient()
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: false })
    
    if (error) throw error
    
    const usersWithRoleInfo = users?.map(user => ({
      ...user,
      roleInfo: getRoleDisplay(user.role || 'user')
    }))
    
    return { success: true, data: usersWithRoleInfo }
  } catch (error) {
    console.error('Error fetching users with role info:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
