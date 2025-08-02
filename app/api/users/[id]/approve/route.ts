import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabaseServer"
import { createClient } from "@supabase/supabase-js"

// PUT - Approve or reject user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient()

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create admin client for database operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const userId = params.id
    const body = await request.json()
    const { status, role } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!status || !["active", "inactive", "pending"].includes(status)) {
      return NextResponse.json({ 
        error: "Valid status is required (active, inactive, or pending)" 
      }, { status: 400 })
    }

    // Check if current user has admin permissions
    const { data: currentUserProfile } = await adminClient
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single()

    if (!currentUserProfile || currentUserProfile.role !== "admin" || currentUserProfile.status !== "active") {
      return NextResponse.json({ 
        error: "Only active administrators can approve users" 
      }, { status: 403 })
    }

    // Update user status and role if provided
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (role && ["user", "manager", "admin"].includes(role)) {
      updateData.role = role
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(updateData)
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `User ${status === 'active' ? 'approved' : status === 'inactive' ? 'deactivated' : 'set to pending'} successfully`
    })
  } catch (error) {
    console.error("Error in PUT /api/users/[id]/approve:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
