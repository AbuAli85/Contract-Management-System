// Permission Matrix for Role-Based Access Control
// This defines what each role can do in the system

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  roles: string[];
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
  description: string;
  level: number; // Higher number = more privileges
}

// Define all available permissions
export const PERMISSIONS: Permission[] = [
  // User Management
  {
    id: 'users.create',
    name: 'Create Users',
    description: 'Can create new users in the system',
    resource: 'users',
    action: 'create',
    roles: ['admin']
  },
  {
    id: 'users.read',
    name: 'Read Users',
    description: 'Can view user information',
    resource: 'users',
    action: 'read',
    roles: ['admin', 'manager']
  },
  {
    id: 'users.update',
    name: 'Update Users',
    description: 'Can modify user information',
    resource: 'users',
    action: 'update',
    roles: ['admin', 'manager']
  },
  {
    id: 'users.delete',
    name: 'Delete Users',
    description: 'Can remove users from the system',
    resource: 'users',
    action: 'delete',
    roles: ['admin']
  },
  {
    id: 'users.manage_roles',
    name: 'Manage User Roles',
    description: 'Can assign and change user roles',
    resource: 'users',
    action: 'manage_roles',
    roles: ['admin']
  },

  // Contract Management
  {
    id: 'contracts.create',
    name: 'Create Contracts',
    description: 'Can create new contracts',
    resource: 'contracts',
    action: 'create',
    roles: ['admin', 'manager', 'user']
  },
  {
    id: 'contracts.read',
    name: 'Read Contracts',
    description: 'Can view contract information',
    resource: 'contracts',
    action: 'read',
    roles: ['admin', 'manager', 'user', 'provider', 'client']
  },
  {
    id: 'contracts.update',
    name: 'Update Contracts',
    description: 'Can modify contract information',
    resource: 'contracts',
    action: 'update',
    roles: ['admin', 'manager', 'user']
  },
  {
    id: 'contracts.delete',
    name: 'Delete Contracts',
    description: 'Can remove contracts',
    resource: 'contracts',
    action: 'delete',
    roles: ['admin', 'manager']
  },
  {
    id: 'contracts.approve',
    name: 'Approve Contracts',
    description: 'Can approve contract workflows',
    resource: 'contracts',
    action: 'approve',
    roles: ['admin', 'manager']
  },

  // Provider Management
  {
    id: 'providers.create',
    name: 'Create Providers',
    description: 'Can create new provider accounts',
    resource: 'providers',
    action: 'create',
    roles: ['admin', 'manager']
  },
  {
    id: 'providers.read',
    name: 'Read Providers',
    description: 'Can view provider information',
    resource: 'providers',
    action: 'read',
    roles: ['admin', 'manager', 'user', 'client']
  },
  {
    id: 'providers.update',
    name: 'Update Providers',
    description: 'Can modify provider information',
    resource: 'providers',
    action: 'update',
    roles: ['admin', 'manager']
  },
  {
    id: 'providers.delete',
    name: 'Delete Providers',
    description: 'Can remove provider accounts',
    resource: 'providers',
    action: 'delete',
    roles: ['admin']
  },

  // Booking Management
  {
    id: 'bookings.create',
    name: 'Create Bookings',
    description: 'Can create new bookings',
    resource: 'bookings',
    action: 'create',
    roles: ['admin', 'manager', 'user', 'client']
  },
  {
    id: 'bookings.read',
    name: 'Read Bookings',
    description: 'Can view booking information',
    resource: 'bookings',
    action: 'read',
    roles: ['admin', 'manager', 'user', 'provider', 'client']
  },
  {
    id: 'bookings.update',
    name: 'Update Bookings',
    description: 'Can modify booking information',
    resource: 'bookings',
    action: 'update',
    roles: ['admin', 'manager', 'user']
  },
  {
    id: 'bookings.delete',
    name: 'Delete Bookings',
    description: 'Can remove bookings',
    resource: 'bookings',
    action: 'delete',
    roles: ['admin', 'manager']
  },

  // Analytics & Reporting
  {
    id: 'analytics.read',
    name: 'View Analytics',
    description: 'Can access system analytics and reports',
    resource: 'analytics',
    action: 'read',
    roles: ['admin', 'manager']
  },
  {
    id: 'analytics.export',
    name: 'Export Analytics',
    description: 'Can export analytics data',
    resource: 'analytics',
    action: 'export',
    roles: ['admin', 'manager']
  },

  // System Administration
  {
    id: 'system.settings',
    name: 'System Settings',
    description: 'Can modify system configuration',
    resource: 'system',
    action: 'settings',
    roles: ['admin']
  },
  {
    id: 'system.logs',
    name: 'System Logs',
    description: 'Can view system logs and audit trails',
    resource: 'system',
    action: 'logs',
    roles: ['admin']
  },
  {
    id: 'system.backup',
    name: 'System Backup',
    description: 'Can perform system backups',
    resource: 'system',
    action: 'backup',
    roles: ['admin']
  },

  // Notifications
  {
    id: 'notifications.create',
    name: 'Create Notifications',
    description: 'Can send system notifications',
    resource: 'notifications',
    action: 'create',
    roles: ['admin', 'manager']
  },
  {
    id: 'notifications.read',
    name: 'Read Notifications',
    description: 'Can view notifications',
    resource: 'notifications',
    action: 'read',
    roles: ['admin', 'manager', 'user', 'provider', 'client']
  },

  // Marketplace
  {
    id: 'marketplace.create',
    name: 'Create Marketplace Items',
    description: 'Can create marketplace listings',
    resource: 'marketplace',
    action: 'create',
    roles: ['admin', 'manager', 'provider']
  },
  {
    id: 'marketplace.read',
    name: 'Read Marketplace',
    description: 'Can view marketplace',
    resource: 'marketplace',
    action: 'read',
    roles: ['admin', 'manager', 'user', 'provider', 'client']
  },
  {
    id: 'marketplace.update',
    name: 'Update Marketplace Items',
    description: 'Can modify marketplace listings',
    resource: 'marketplace',
    action: 'update',
    roles: ['admin', 'manager', 'provider']
  },
  {
    id: 'marketplace.delete',
    name: 'Delete Marketplace Items',
    description: 'Can remove marketplace listings',
    resource: 'marketplace',
    action: 'delete',
    roles: ['admin', 'manager', 'provider']
  }
];

// Define role-based permission sets
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    level: 100,
    description: 'Full system access with all permissions',
    permissions: PERMISSIONS // Admins get all permissions
  },
  {
    role: 'manager',
    level: 80,
    description: 'High-level management with most operational permissions',
    permissions: PERMISSIONS.filter(p => 
      !p.roles.includes('admin') || p.roles.includes('manager')
    )
  },
  {
    role: 'user',
    level: 60,
    description: 'Standard user with basic operational permissions',
    permissions: PERMISSIONS.filter(p => 
      ['user', 'manager', 'admin'].some(role => p.roles.includes(role))
    )
  },
  {
    role: 'provider',
    level: 40,
    description: 'Service provider with limited access',
    permissions: PERMISSIONS.filter(p => 
      ['provider', 'user', 'manager', 'admin'].some(role => p.roles.includes(role))
    )
  },
  {
    role: 'client',
    level: 20,
    description: 'Client with minimal access',
    permissions: PERMISSIONS.filter(p => 
      ['client', 'user', 'manager', 'admin'].some(role => p.roles.includes(role))
    )
  }
];

// Helper functions for permission checking
export function hasPermission(userRole: string, permissionId: string): boolean {
  const permission = PERMISSIONS.find(p => p.id === permissionId);
  if (!permission) return false;
  
  return permission.roles.includes(userRole);
}

export function getUserPermissions(userRole: string): Permission[] {
  return PERMISSIONS.filter(p => p.roles.includes(userRole));
}

export function canPerformAction(userRole: string, resource: string, action: string): boolean {
  return PERMISSIONS.some(p => 
    p.resource === resource && 
    p.action === action && 
    p.roles.includes(userRole)
  );
}

export function getRoleLevel(role: string): number {
  const rolePerms = ROLE_PERMISSIONS.find(rp => rp.role === role);
  return rolePerms?.level || 0;
}

export function canManageRole(userRole: string, targetRole: string): boolean {
  const userLevel = getRoleLevel(userRole);
  const targetLevel = getRoleLevel(targetRole);
  
  // Users can only manage roles at or below their level
  return userLevel > targetLevel;
}

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: ['users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles'],
  CONTRACT_MANAGEMENT: ['contracts.create', 'contracts.read', 'contracts.update', 'contracts.delete', 'contracts.approve'],
  PROVIDER_MANAGEMENT: ['providers.create', 'providers.read', 'providers.update', 'providers.delete'],
  BOOKING_MANAGEMENT: ['bookings.create', 'bookings.read', 'bookings.update', 'bookings.delete'],
  ANALYTICS: ['analytics.read', 'analytics.export'],
  SYSTEM_ADMIN: ['system.settings', 'system.logs', 'system.backup'],
  NOTIFICATIONS: ['notifications.create', 'notifications.read'],
  MARKETPLACE: ['marketplace.create', 'marketplace.read', 'marketplace.update', 'marketplace.delete']
};

// Export permission checking utilities
export const PermissionUtils = {
  hasPermission,
  getUserPermissions,
  canPerformAction,
  getRoleLevel,
  canManageRole,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS
};
