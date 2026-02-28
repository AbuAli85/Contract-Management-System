import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

async function getHandler(request: NextRequest) {
  try {
    // Define available permissions based on the system's permission structure
    const permissions = [
      // Contract permissions
      {
        id: 'contract:create',
        name: 'Create Contract',
        description: 'Create new contracts',
        category: 'Contracts',
        resource: 'contract',
        action: 'create',
      },
      {
        id: 'contract:read',
        name: 'View Contracts',
        description: 'View contract details',
        category: 'Contracts',
        resource: 'contract',
        action: 'read',
      },
      {
        id: 'contract:update',
        name: 'Edit Contracts',
        description: 'Modify existing contracts',
        category: 'Contracts',
        resource: 'contract',
        action: 'update',
      },
      {
        id: 'contract:delete',
        name: 'Delete Contracts',
        description: 'Remove contracts',
        category: 'Contracts',
        resource: 'contract',
        action: 'delete',
      },
      {
        id: 'contract:approve',
        name: 'Approve Contracts',
        description: 'Approve contract submissions',
        category: 'Contracts',
        resource: 'contract',
        action: 'approve',
      },

      // Promoter permissions
      {
        id: 'promoter:create',
        name: 'Create Promoter',
        description: 'Add new promoters',
        category: 'Promoters',
        resource: 'promoter',
        action: 'create',
      },
      {
        id: 'promoter:read',
        name: 'View Promoters',
        description: 'View promoter details',
        category: 'Promoters',
        resource: 'promoter',
        action: 'read',
      },
      {
        id: 'promoter:update',
        name: 'Edit Promoters',
        description: 'Modify promoter information',
        category: 'Promoters',
        resource: 'promoter',
        action: 'update',
      },
      {
        id: 'promoter:delete',
        name: 'Delete Promoters',
        description: 'Remove promoters',
        category: 'Promoters',
        resource: 'promoter',
        action: 'delete',
      },

      // Party permissions
      {
        id: 'party:create',
        name: 'Create Party',
        description: 'Add new parties',
        category: 'Parties',
        resource: 'party',
        action: 'create',
      },
      {
        id: 'party:read',
        name: 'View Parties',
        description: 'View party details',
        category: 'Parties',
        resource: 'party',
        action: 'read',
      },
      {
        id: 'party:update',
        name: 'Edit Parties',
        description: 'Modify party information',
        category: 'Parties',
        resource: 'party',
        action: 'update',
      },
      {
        id: 'party:delete',
        name: 'Delete Parties',
        description: 'Remove parties',
        category: 'Parties',
        resource: 'party',
        action: 'delete',
      },

      // User permissions
      {
        id: 'user:create',
        name: 'Create User',
        description: 'Add new users',
        category: 'Users',
        resource: 'user',
        action: 'create',
      },
      {
        id: 'user:read',
        name: 'View Users',
        description: 'View user details',
        category: 'Users',
        resource: 'user',
        action: 'read',
      },
      {
        id: 'user:update',
        name: 'Edit Users',
        description: 'Modify user information',
        category: 'Users',
        resource: 'user',
        action: 'update',
      },
      {
        id: 'user:delete',
        name: 'Delete Users',
        description: 'Remove users',
        category: 'Users',
        resource: 'user',
        action: 'delete',
      },

      // System permissions
      {
        id: 'system:analytics',
        name: 'View Analytics',
        description: 'Access system analytics',
        category: 'System',
        resource: 'system',
        action: 'analytics',
      },
      {
        id: 'system:settings',
        name: 'Manage Settings',
        description: 'Configure system settings',
        category: 'System',
        resource: 'system',
        action: 'settings',
      },
      {
        id: 'system:audit_logs',
        name: 'View Audit Logs',
        description: 'Access audit logs',
        category: 'System',
        resource: 'system',
        action: 'audit_logs',
      },
      {
        id: 'system:notifications',
        name: 'Manage Notifications',
        description: 'Configure notifications',
        category: 'System',
        resource: 'system',
        action: 'notifications',
      },
    ];

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export const GET = withRBAC('permissions:read:company', getHandler);
