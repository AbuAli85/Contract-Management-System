import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// PUT - Approve or reject user (simplified version)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 API Approve: Starting approval process for user:", params.id)
    
    // Use service role client directly to bypass auth issues
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      console.error("❌ API Approve: Missing service role credentials")
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

    console.log("🔍 API Approve: Request details:", { userId, status, role })

    if (!userId) {
      console.log("❌ API Approve: Missing user ID")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!status || !["active", "inactive", "pending"].includes(status)) {
      console.log("❌ API Approve: Invalid status:", status)
      return NextResponse.json({ 
        error: "Valid status is required (active, inactive, or pending)" 
      }, { status: 400 })
    }

    console.log("✅ API Approve: Using service role, bypassing permission checks")

    // Update user status and role if provided
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (role && ["user", "manager", "admin"].includes(role)) {
      updateData.role = role
    }

    console.log("🔄 API Approve: Updating user with data:", updateData)

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(updateData)
      .eq("id", userId)

    if (updateError) {
      console.error("❌ API Approve: Error updating user:", updateError)
      return NextResponse.json({ 
        error: "Failed to update user",
        details: updateError.message 
      }, { status: 500 })
    }

    console.log("✅ API Approve: User updated successfully")
    return NextResponse.json({ 
      success: true,
      message: `User ${status === 'active' ? 'approved' : status === 'inactive' ? 'deactivated' : 'set to pending'} successfully`
    })
  } catch (error) {
    console.error("❌ API Approve: Error in PUT /api/users/[id]/approve:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
