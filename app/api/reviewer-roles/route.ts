import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const roleType = searchParams.get("role_type")
    const isActive = searchParams.get("is_active")

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can view reviewer roles" }, { status: 403 })
    }

    // Build query
    let query = supabase.from("reviewer_roles").select(`
        *,
        user:users(id, email, full_name, role),
        assigned_by_user:users!reviewer_roles_assigned_by_fkey(id, email, full_name)
      `)

    // Filter by role type if provided
    if (roleType) {
      query = query.eq("role_type", roleType)
    }

    // Filter by active status if provided
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true")
    }

    const { data: roles, error: rolesError } = await query

    if (rolesError) {
      console.error("Error fetching reviewer roles:", rolesError)
      return NextResponse.json({ error: "Failed to fetch reviewer roles" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      roles: roles || [],
    })
  } catch (error) {
    console.error("Error in reviewer roles GET:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { user_id, role_type } = body

    // Validate required fields
    if (!user_id || !role_type) {
      return NextResponse.json(
        {
          error: "Missing required fields: user_id, role_type",
        },
        { status: 400 },
      )
    }

    // Validate role type
    const validRoleTypes = ["legal_reviewer", "hr_reviewer", "final_approver", "signatory"]
    if (!validRoleTypes.includes(role_type)) {
      return NextResponse.json(
        {
          error: `Invalid role_type. Must be one of: ${validRoleTypes.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can assign reviewer roles" }, { status: 403 })
    }

    // Check if user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if role already exists for this user
    const { data: existingRole } = await supabase
      .from("reviewer_roles")
      .select("id")
      .eq("user_id", user_id)
      .eq("role_type", role_type)
      .single()

    if (existingRole) {
      // Update existing role to active
      const { data: updatedRole, error: updateError } = await supabase
        .from("reviewer_roles")
        .update({})
        .eq("id", existingRole.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating reviewer role:", updateError)
        return NextResponse.json({ error: "Failed to update reviewer role" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        role: updatedRole,
        message: "Reviewer role activated successfully",
      })
    }

    // Create new role
    const { data: newRole, error: createError } = await supabase
      .from("reviewer_roles")
      .insert({
        id_user: user_id,
        role_name: role_type,
        approval_order: 1,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating reviewer role:", createError)
      return NextResponse.json({ error: "Failed to create reviewer role" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      role: newRole,
      message: "Reviewer role assigned successfully",
    })
  } catch (error) {
    console.error("Error in reviewer roles POST:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { role_id, is_active } = body

    // Validate required fields
    if (!role_id || typeof is_active !== "boolean") {
      return NextResponse.json(
        {
          error: "Missing required fields: role_id, is_active",
        },
        { status: 400 },
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can update reviewer roles" }, { status: 403 })
    }

    // Update role
    const { data: updatedRole, error: updateError } = await supabase
      .from("reviewer_roles")
      .update({})
      .eq("id", role_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating reviewer role:", updateError)
      return NextResponse.json({ error: "Failed to update reviewer role" }, { status: 500 })
    }

    if (!updatedRole) {
      return NextResponse.json({ error: "Reviewer role not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      role: updatedRole,
      message: "Reviewer role updated successfully",
    })
  } catch (error) {
    console.error("Error in reviewer roles PUT:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const roleId = searchParams.get("id")

    if (!roleId) {
      return NextResponse.json({ error: "role_id parameter is required" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can delete reviewer roles" }, { status: 403 })
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase.from("reviewer_roles").update({}).eq("id", roleId)

    if (deleteError) {
      console.error("Error deleting reviewer role:", deleteError)
      return NextResponse.json({ error: "Failed to delete reviewer role" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Reviewer role deleted successfully",
    })
  } catch (error) {
    console.error("Error in reviewer roles DELETE:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
