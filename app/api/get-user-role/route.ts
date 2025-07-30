import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabaseServer"
import { cookies } from "next/headers"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET USER ROLE START ===")

    // Create server component client that properly reads cookies
    const supabase = await createServerComponentClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ Session error:", sessionError)
      return NextResponse.json({ error: "Session error" }, { status: 401 })
    }

    if (!session) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user
    console.log("✅ User authenticated:", { id: user.id, email: user.email })

    // Get the latest role from all possible sources
    let currentRole = "user"
    let roleSource = "default"

    // Check users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!usersError && usersData?.role) {
        currentRole = usersData.role
        roleSource = "users"
        console.log("✅ Role from users table:", currentRole)
      }
    } catch (error) {
      console.log("Users table error:", error)
    }

    // Check profiles table if users didn't have role
    if (roleSource === "default") {
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profilesError && profilesData?.role) {
          currentRole = profilesData.role
          roleSource = "profiles"
          console.log("✅ Role from profiles table:", currentRole)
        }
      } catch (error) {
        console.log("Profiles table error:", error)
      }
    }

    // Check app_users table if still no role
    if (roleSource === "default") {
      try {
        const { data: appUsersData, error: appUsersError } = await supabase
          .from("app_users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!appUsersError && appUsersData?.role) {
          currentRole = appUsersData.role
          roleSource = "app_users"
          console.log("✅ Role from app_users table:", currentRole)
        }
      } catch (error) {
        console.log("App_users table error:", error)
      }
    }

    // If no role found, set admin role
    if (roleSource === "default") {
      console.log("⚠️ No role found, setting admin role...")
      currentRole = "admin"
      roleSource = "default (admin)"
    }

    console.log("=== GET USER ROLE COMPLETE ===")

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      role: {
        value: currentRole,
        source: roleSource,
        timestamp: new Date().toISOString(),
      },
      summary: {
        finalRole: currentRole,
        roleSource: roleSource,
        message: `Current role: ${currentRole} (from ${roleSource})`,
      },
    })
  } catch (error) {
    console.error("=== GET USER ROLE ERROR ===")
    console.error("Unexpected error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Get user role failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
