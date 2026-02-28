// ========================================
// 🛡️ ADMIN ROLES API (platform roles table only)
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

/**
 * GET /api/admin/roles — list platform roles with permissions and user counts
 * Required permission: roles:read:all
 */
async function getHandler(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all roles with their permissions
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select(
        `
        id,
        name,
        category,
        description,
        created_at,
        updated_at
      `
      )
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (rolesError) {
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }

    // Get permission counts for each role
    const { data: rolePermissions, error: permError } = await supabase.from(
      'role_permissions'
    ).select(`
        role_id,
        permissions!inner(
          name,
          resource,
          action,
          scope
        )
      `);

    if (permError) {
      return NextResponse.json(
        { error: 'Failed to fetch role permissions' },
        { status: 500 }
      );
    }

    // Get user counts for each role
    const { data: userCounts, error: userError } = await supabase
      .from('user_role_assignments')
      .select(
        `
        role_id,
        user_id
      `
      )
      .eq('is_active', true)
      .is('valid_until', null);

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch user counts' },
        { status: 500 }
      );
    }

    // Build response data
    const rolesWithDetails = roles.map(role => {
      const permissions = rolePermissions
        .filter(rp => rp.role_id === role.id)
        .map(rp => ({
          name: rp.permissions.name,
          resource: rp.permissions.resource,
          action: rp.permissions.action,
          scope: rp.permissions.scope,
        }));

      const userCount = userCounts.filter(uc => uc.role_id === role.id).length;

      return {
        ...role,
        permissions,
        user_count: userCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        roles: rolesWithDetails,
        total_roles: rolesWithDetails.length,
        total_permissions: rolePermissions.length,
        total_users_with_roles: userCounts.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles — create platform role
 * Required permission: roles:manage:all
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, description } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['client', 'provider', 'admin', 'system'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if role already exists
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check existing role' },
        { status: 500 }
      );
    }

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 409 }
      );
    }

    // Create the role
    const { data: newRole, error: createError } = await supabase
      .from('roles')
      .insert({
        name,
        category,
        description: description || null,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newRole,
        message: 'Role created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRBAC('roles:read:all', getHandler);
export const POST = withRBAC('roles:manage:all', postHandler);
