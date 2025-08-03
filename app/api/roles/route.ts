import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRoleDisplay } from "@/lib/role-hierarchy"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get unique roles from users table
    const { data: users, error: usersError } = await supabase.from("users").select("role")

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch users",
        },
        { status: 500 },
      )
    }

    // Count users per role (filter out null roles)
    const roleCounts = (users || []).reduce(
      (acc, user) => {
        if (user.role) {
          acc[user.role] = (acc[user.role] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Create role objects
    const roles = Object.entries(roleCounts).map(([roleName, userCount]) => ({
      id: roleName,
      name: roleName,
      description: `${getRoleDisplay(roleName).displayText} role`,
      permissions: [], // Will be populated from permissions table
      userCount,
      created_at: new Date().toISOString(),
      is_system: roleName === "admin" || roleName === "user",
    }))

    return NextResponse.json({
      success: true,
      roles,
    })
  } catch (error) {
    console.error("Roles API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { name, description, permissions } = await request.json()

    // Validate input
    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and description are required",
        },
        { status: 400 },
      )
    }

    // Check if role already exists by checking if any users have this role
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("role", name)
      .limit(1)

    if (checkError) {
      console.error("Error checking existing role:", checkError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check existing role",
        },
        { status: 500 },
      )
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Role with this name already exists",
        },
        { status: 400 },
      )
    }

    // Since we don't have a roles table, we'll just return success
    // The role will be created when a user is assigned this role
    const newRole = {
      id: name,
      name,
      description,
      permissions: permissions || [],
      userCount: 0,
      created_at: new Date().toISOString(),
      is_system: false,
    }

    return NextResponse.json({
      success: true,
      role: newRole,
    })
  } catch (error) {
    console.error("Create role error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
