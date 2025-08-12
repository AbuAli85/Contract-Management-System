import { createClient } from '@/lib/supabase/client';

// Enhanced role system with client/provider support
export const ENHANCED_ROLES = [
  'super_admin',
  'admin',
  'manager',
  'provider',
  'client',
  'user',
  'viewer',
] as const;

export type EnhancedUserRole = (typeof ENHANCED_ROLES)[number];

// Role hierarchy with client/provider integration
export const ROLE_HIERARCHY = {
  super_admin: 7, // Highest level - platform administration
  admin: 6, // Company/system administration
  manager: 5, // Team/department management
  provider: 4, // Service provider capabilities
  client: 3, // Client booking and management
  user: 2, // Basic user permissions
  viewer: 1, // Read-only access
} as const;

// Permission categories
export const PERMISSION_CATEGORIES = {
  // Core system permissions
  SYSTEM: 'system',
  USER_MANAGEMENT: 'user_management',
  COMPANY_MANAGEMENT: 'company_management',

  // Client-specific permissions
  BOOKING: 'booking',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
  CLIENT_PROFILE: 'client_profile',

  // Provider-specific permissions
  SERVICE_MANAGEMENT: 'service_management',
  AVAILABILITY: 'availability',
  BOOKING_MANAGEMENT: 'booking_management',
  PROVIDER_PROFILE: 'provider_profile',
  ANALYTICS: 'analytics',

  // Shared permissions
  NOTIFICATIONS: 'notifications',
  COMMUNICATION: 'communication',
  REPORTS: 'reports',
} as const;

// Detailed permissions with role mappings
export const PERMISSIONS = {
  // System permissions
  'system.admin': ['super_admin', 'admin'],
  'system.settings': ['super_admin', 'admin'],
  'system.logs': ['super_admin', 'admin'],
  'system.backup': ['super_admin'],

  // User management
  'users.view': ['super_admin', 'admin', 'manager'],
  'users.create': ['super_admin', 'admin'],
  'users.edit': ['super_admin', 'admin', 'manager'],
  'users.delete': ['super_admin', 'admin'],
  'users.roles': ['super_admin', 'admin'],

  // Company management
  'companies.view': ['super_admin', 'admin', 'manager', 'provider'],
  'companies.create': ['super_admin', 'admin'],
  'companies.edit': ['super_admin', 'admin', 'manager'],
  'companies.delete': ['super_admin', 'admin'],

  // Client permissions
  'bookings.create': ['client', 'user', 'admin', 'super_admin'],
  'bookings.view_own': ['client', 'user', 'provider', 'admin', 'super_admin'],
  'bookings.edit_own': ['client', 'user', 'admin', 'super_admin'],
  'bookings.cancel_own': ['client', 'user', 'admin', 'super_admin'],
  'reviews.create': ['client', 'user', 'admin', 'super_admin'],
  'reviews.edit_own': ['client', 'user', 'admin', 'super_admin'],
  'favorites.manage': ['client', 'user', 'admin', 'super_admin'],
  'client_profile.edit': ['client', 'user', 'admin', 'super_admin'],

  // Provider permissions
  'services.create': ['provider', 'admin', 'super_admin'],
  'services.edit_own': ['provider', 'admin', 'super_admin'],
  'services.delete_own': ['provider', 'admin', 'super_admin'],
  'services.view_all': ['admin', 'super_admin'],
  'availability.manage': ['provider', 'admin', 'super_admin'],
  'bookings.manage_provider': ['provider', 'admin', 'super_admin'],
  'bookings.view_provider': ['provider', 'admin', 'super_admin'],
  'provider_profile.edit': ['provider', 'admin', 'super_admin'],
  'analytics.view_own': ['provider', 'admin', 'super_admin'],
  'analytics.view_all': ['admin', 'super_admin'],

  // Shared permissions
  'notifications.view_own': [
    'client',
    'user',
    'provider',
    'manager',
    'admin',
    'super_admin',
  ],
  'notifications.manage_own': [
    'client',
    'user',
    'provider',
    'manager',
    'admin',
    'super_admin',
  ],
  'communication.send': ['provider', 'admin', 'super_admin'],
  'communication.receive': [
    'client',
    'user',
    'provider',
    'manager',
    'admin',
    'super_admin',
  ],
  'reports.view_own': ['provider', 'admin', 'super_admin'],
  'reports.view_all': ['admin', 'super_admin'],

  // General permissions
  'dashboard.view': [
    'client',
    'user',
    'provider',
    'manager',
    'admin',
    'super_admin',
  ],
  'profile.edit_own': [
    'client',
    'user',
    'provider',
    'manager',
    'admin',
    'super_admin',
  ],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Check if user has permission for a specific action
 */
export function hasPermission(
  userRole: EnhancedUserRole,
  permission: PermissionKey
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: EnhancedUserRole,
  permissions: PermissionKey[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(
  userRole: EnhancedUserRole,
  permissions: PermissionKey[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if user role has higher or equal hierarchy level
 */
export function hasRoleLevel(
  userRole: EnhancedUserRole,
  requiredRole: EnhancedUserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all permissions for a user role
 */
export function getUserPermissions(
  userRole: EnhancedUserRole
): PermissionKey[] {
  return Object.keys(PERMISSIONS).filter(permission =>
    hasPermission(userRole, permission as PermissionKey)
  ) as PermissionKey[];
}

/**
 * Get role-specific dashboard route
 */
export function getRoleDashboardRoute(userRole: EnhancedUserRole): string {
  switch (userRole) {
    case 'super_admin':
    case 'admin':
      return '/dashboard/admin';
    case 'manager':
      return '/dashboard/manager';
    case 'provider':
      return '/dashboard/provider';
    case 'client':
    case 'user':
      return '/dashboard/client';
    case 'viewer':
      return '/dashboard/viewer';
    default:
      return '/dashboard';
  }
}

/**
 * Get role display information
 */
export function getRoleInfo(role: EnhancedUserRole) {
  const roleInfo = {
    super_admin: {
      label: 'Super Admin',
      description: 'Platform administrator with full system access',
      color: 'bg-purple-100 text-purple-800',
      icon: '👑',
    },
    admin: {
      label: 'Admin',
      description: 'System administrator with management capabilities',
      color: 'bg-red-100 text-red-800',
      icon: '🛡️',
    },
    manager: {
      label: 'Manager',
      description: 'Team manager with oversight capabilities',
      color: 'bg-blue-100 text-blue-800',
      icon: '👔',
    },
    provider: {
      label: 'Service Provider',
      description: 'Service provider with booking management',
      color: 'bg-green-100 text-green-800',
      icon: '🏢',
    },
    client: {
      label: 'Client',
      description: 'Client with booking and review capabilities',
      color: 'bg-orange-100 text-orange-800',
      icon: '👤',
    },
    user: {
      label: 'User',
      description: 'Standard user with basic capabilities',
      color: 'bg-gray-100 text-gray-800',
      icon: '👤',
    },
    viewer: {
      label: 'Viewer',
      description: 'Read-only access user',
      color: 'bg-gray-100 text-gray-600',
      icon: '👁️',
    },
  };

  return roleInfo[role] || roleInfo.user;
}

/**
 * Enhanced RBAC hook for React components
 */
export interface EnhancedRBACContext {
  userRole: EnhancedUserRole | null;
  userPermissions: PermissionKey[];
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
  hasRoleLevel: (requiredRole: EnhancedUserRole) => boolean;
  isLoading: boolean;
  companyId?: string | null;
  isCompanyMember: boolean;
  refreshRoles: () => Promise<void>;
}

/**
 * Get user's enhanced role information
 */
export async function getUserRoleInfo(userId: string): Promise<{
  role: EnhancedUserRole;
  companyId?: string;
  permissions: PermissionKey[];
}> {
  const supabase = createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('Failed to fetch user role information');
  }

  const role = user.role as EnhancedUserRole;
  const permissions = getUserPermissions(role);

  return {
    role,
    companyId: user.company_id,
    permissions,
  };
}

/**
 * Check if user can access specific resource
 */
export async function canAccessResource(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete' = 'read'
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { role, companyId } = await getUserRoleInfo(userId);

    // Super admin can access everything
    if (role === 'super_admin') {
      return true;
    }

    // Role-specific resource access logic
    switch (resourceType) {
      case 'service':
        if (action === 'read') {
          return (
            hasPermission(role, 'services.view_all') ||
            hasPermission(role, 'services.edit_own')
          );
        }
        if (action === 'write' || action === 'delete') {
          // Check if user owns the service or is admin
          const { data: service } = await supabase
            .from('provider_services')
            .select('provider_id, company_id')
            .eq('id', resourceId)
            .single();

          return (
            service?.provider_id === userId ||
            service?.company_id === companyId ||
            hasPermission(role, 'services.view_all')
          );
        }
        break;

      case 'booking':
        if (action === 'read') {
          const { data: booking } = await supabase
            .from('bookings')
            .select('client_id, provider_id')
            .eq('id', resourceId)
            .single();

          return (
            booking?.client_id === userId ||
            booking?.provider_id === userId ||
            hasPermission(role, 'bookings.view_all')
          );
        }
        // Add more booking access logic as needed
        break;

      case 'company':
        const { data: userCompany } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', userId)
          .single();

        return (
          userCompany?.company_id === resourceId ||
          hasPermission(role, 'companies.view')
        );

      default:
        return false;
    }

    return false;
  } catch (error) {
    console.error('Error checking resource access:', error);
    return false;
  }
}

/**
 * Middleware function to check permissions
 */
export function requirePermission(permission: PermissionKey) {
  return async (userId: string): Promise<boolean> => {
    try {
      const { role } = await getUserRoleInfo(userId);
      return hasPermission(role, permission);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };
}

/**
 * Role-based navigation items
 */
export function getNavigationItems(userRole: EnhancedUserRole) {
  const allItems = [
    {
      label: 'Dashboard',
      href: getRoleDashboardRoute(userRole),
      permission: 'dashboard.view' as PermissionKey,
      icon: '📊',
    },
    {
      label: 'My Bookings',
      href: '/bookings',
      permission: 'bookings.view_own' as PermissionKey,
      icon: '📅',
    },
    {
      label: 'Services',
      href: '/services',
      permission: 'services.view_all' as PermissionKey,
      icon: '🏢',
    },
    {
      label: 'My Services',
      href: '/provider/services',
      permission: 'services.edit_own' as PermissionKey,
      icon: '⚙️',
    },
    {
      label: 'Availability',
      href: '/provider/availability',
      permission: 'availability.manage' as PermissionKey,
      icon: '⏰',
    },
    {
      label: 'Analytics',
      href: '/provider/analytics',
      permission: 'analytics.view_own' as PermissionKey,
      icon: '📈',
    },
    {
      label: 'Users',
      href: '/admin/users',
      permission: 'users.view' as PermissionKey,
      icon: '👥',
    },
    {
      label: 'Companies',
      href: '/admin/companies',
      permission: 'companies.view' as PermissionKey,
      icon: '🏢',
    },
    {
      label: 'System Settings',
      href: '/admin/settings',
      permission: 'system.settings' as PermissionKey,
      icon: '⚙️',
    },
  ];

  return allItems.filter(item => hasPermission(userRole, item.permission));
}
