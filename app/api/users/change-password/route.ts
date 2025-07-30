import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword, userId: targetUserId } = body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        {
          error:
            "New password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
        { status: 400 },
      )
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 },
      )
    }

    // Determine which user's password to change
    const userIdToChange = targetUserId || user.id

    // Check permissions - users can only change their own password, admins can change any password
    if (userIdToChange !== user.id) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!userProfile || userProfile.role !== "admin") {
        return NextResponse.json(
          { error: "Insufficient permissions to change other user passwords" },
          { status: 403 },
        )
      }
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Get the target user's email if changing someone else's password
    let targetUserEmail = user.email
    if (userIdToChange !== user.id) {
      const { data: targetUser } = await supabase
        .from("users")
        .select("email")
        .eq("id", userIdToChange)
        .single()

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 })
      }

      targetUserEmail = targetUser.email
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(userIdToChange, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    // Log the password change activity (optional)
    console.log(`Password changed for user ${userIdToChange} by ${user.id}`)

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Error in POST /api/users/change-password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
