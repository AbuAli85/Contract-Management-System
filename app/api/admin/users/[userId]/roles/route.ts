// ========================================
// 🛡️ ADMIN USER ROLE ASSIGNMENT API
// ========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { guardPermission } from '@/lib/rbac/guard'
import { auditLogger } from '@/lib/rbac/audit'
import { permissionCache } from '@/lib/rbac/cache'

/**
 * GET /api/admin/users/[userId]/roles
 * Get user's current roles
 * Required permission: user:read:all
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check permission
    const guardResult = await guardPermission('user:read:all', request)
    if (guardResult) {
      return guardResult
    }

    const { userId } = params
    const supabase = await createClient()

    // Get user's current role assignments
    const { data: roleAssignments, error: roleError } = await supabase
      .from('user_role_assignments')
      .select(`
        id,
        role_id,
        assigned_by,
        context,
        valid_from,
        valid_until,
        is_active,
        created_at,
        updated_at,
        roles!inner(
          id,
          name,
          category,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (roleError) {
      console.error('🔐 RBAC: Error fetching user roles:', roleError)
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      )
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('🔐 RBAC: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        roles: roleAssignments.map(ra => ({
          assignment_id: ra.id,
          role: ra.roles,
          assigned_by: ra.assigned_by,
          context: ra.context,
          valid_from: ra.valid_from,
          valid_until: ra.valid_until,
          is_active: ra.is_active,
          created_at: ra.created_at,
          updated_at: ra.updated_at
        })),
        total_roles: roleAssignments.length
      }
    })
  } catch (error) {
    console.error('🔐 RBAC: Error in GET /api/admin/users/[userId]/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users/[userId]/roles
 * Assign role to user
 * Required permission: role:assign:all
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check permission
    const guardResult = await guardPermission('role:assign:all', request)
    if (guardResult) {
      return guardResult
    }

    const { userId } = params
    const body = await request.json()
    const { role_id, context, valid_until, assigned_by } = body

    // Validate required fields
    if (!role_id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user (who is making the assignment)
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the role exists
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, category')
      .eq('id', role_id)
      .single()

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Verify the target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Check if role is already assigned
    const { data: existingAssignment, error: checkError } = await supabase
      .from('user_role_assignments')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('role_id', role_id)
      .eq('is_active', true)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('🔐 RBAC: Error checking existing role assignment:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing role assignment' },
        { status: 500 }
      )
    }

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User already has this role assigned' },
        { status: 409 }
      )
    }

    // Get user's current roles for audit
    const { data: currentRoles, error: currentRolesError } = await supabase
      .from('user_role_assignments')
      .select(`
        roles!inner(name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('valid_until', null)

    const oldRoleNames = currentRoles?.map(r => r.roles.name) || []

    // Create the role assignment
    const { data: newAssignment, error: createError } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role_id,
        assigned_by: assigned_by || currentUser.id,
        context: context || {},
        valid_from: new Date().toISOString(),
        valid_until: valid_until || null,
        is_active: true
      })
      .select(`
        id,
        user_id,
        role_id,
        assigned_by,
        context,
        valid_from,
        valid_until,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (createError) {
      console.error('🔐 RBAC: Error creating role assignment:', createError)
      return NextResponse.json(
        { error: 'Failed to assign role' },
        { status: 500 }
      )
    }

    // Get new role names for audit
    const newRoleNames = [...oldRoleNames, role.name]

    // Audit the role change
    try {
      await auditLogger.logRoleChange({
        user_id: userId,
        old_roles: oldRoleNames,
        new_roles: newRoleNames,
        changed_by: currentUser.id,
        ip_address: auditLogger.constructor.getClientIP(request),
        user_agent: auditLogger.constructor.getUserAgent(request)
      })
    } catch (auditError) {
      console.warn('🔐 RBAC: Failed to audit role change:', auditError)
    }

    // Invalidate user's permission cache
    try {
      await permissionCache.invalidateUser(userId)
    } catch (cacheError) {
      console.warn('🔐 RBAC: Failed to invalidate user cache:', cacheError)
    }

    // Refresh materialized view
    try {
      await supabase.rpc('refresh_user_permissions')
    } catch (refreshError) {
      console.warn('🔐 RBAC: Failed to refresh materialized view:', refreshError)
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment: newAssignment,
        role: {
          id: role.id,
          name: role.name,
          category: role.category
        },
        user: {
          id: targetUser.id,
          email: targetUser.email
        }
      },
      message: 'Role assigned successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('🔐 RBAC: Error in POST /api/admin/users/[userId]/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId]/roles
 * Remove role from user
 * Required permission: role:assign:all
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check permission
    const guardResult = await guardPermission('role:assign:all', request)
    if (guardResult) {
      return guardResult
    }

    const { userId } = params
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('role_id')

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required as query parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user (who is making the removal)
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's current roles for audit
    const { data: currentRoles, error: currentRolesError } = await supabase
      .from('user_role_assignments')
      .select(`
        roles!inner(name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('valid_until', null)

    const oldRoleNames = currentRoles?.map(r => r.roles.name) || []

    // Deactivate the role assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('user_role_assignments')
      .update({
        is_active: false,
        valid_until: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .eq('is_active', true)
      .select()
      .single()

    if (updateError) {
      console.error('🔐 RBAC: Error deactivating role assignment:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove role' },
        { status: 500 }
      )
    }

    if (!updatedAssignment) {
      return NextResponse.json(
        { error: 'Role assignment not found or already inactive' },
        { status: 404 }
      )
    }

    // Get role name for audit
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single()

    const roleName = role?.name || 'Unknown'
    const newRoleNames = oldRoleNames.filter(name => name !== roleName)

    // Audit the role change
    try {
      await auditLogger.logRoleChange({
        user_id: userId,
        old_roles: oldRoleNames,
        new_roles: newRoleNames,
        changed_by: currentUser.id,
        ip_address: auditLogger.constructor.getClientIP(request),
        user_agent: auditLogger.constructor.getUserAgent(request)
      })
    } catch (auditError) {
      console.warn('🔐 RBAC: Failed to audit role change:', auditError)
    }

    // Invalidate user's permission cache
    try {
      await permissionCache.invalidateUser(userId)
    } catch (cacheError) {
      console.warn('🔐 RBAC: Failed to invalidate user cache:', cacheError)
    }

    // Refresh materialized view
    try {
      await supabase.rpc('refresh_user_permissions')
    } catch (refreshError) {
      console.warn('🔐 RBAC: Failed to refresh materialized view:', refreshError)
    }

    return NextResponse.json({
      success: true,
      data: {
        removed_role: roleName,
        user_id: userId
      },
      message: 'Role removed successfully'
    })
  } catch (error) {
    console.error('🔐 RBAC: Error in DELETE /api/admin/users/[userId]/roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
