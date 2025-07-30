import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    console.log("🔐 Logout API called")

    const supabase = await createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("🔐 Logout error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to logout",
        },
        { status: 500 },
      )
    }

    console.log("🔐 User signed out successfully")

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Define secure cookie clearing options
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || process.env.FORCE_HTTPS === "true",
      sameSite: "strict" as const,
      expires: new Date(0),
    }

    // Clear all possible auth cookies
    const cookiesToClear = [
      // Supabase auth cookies
      "sb-auth-token.0",
      "sb-auth-token.1",
      "sb-auth-token-code-verifier",
      "sb-auth-token-user",
      "sb-ekdjxzhujettocosgzql-auth-token.0",
      "sb-ekdjxzhujettocosgzql-auth-token.1",
      "sb-ekdjxzhujettocosgzql-auth-token-code-verifier",
      "sb-ekdjxzhujettocosgzql-auth-token-user",
      // Generic auth cookies
      "sb-auth-token",
      "sb-ekdjxzhujettocosgzql-auth-token",
      // Session cookies
      "session",
      "auth-session",
      // Any other potential auth cookies
      "supabase.auth.token",
      "supabase.auth.refreshToken",
    ]

    cookiesToClear.forEach((cookieName) => {
      response.cookies.set(cookieName, "", cookieOptions)
      // Also try with different paths
      response.cookies.set(cookieName, "", { ...cookieOptions, path: "/" })
      response.cookies.set(cookieName, "", { ...cookieOptions, path: "/api" })
    })

    console.log("🔐 Auth cookies cleared:", cookiesToClear)

    return response
  } catch (error) {
    console.error("🔐 Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  // Redirect GET requests to POST
  return NextResponse.redirect(new URL("/api/auth/logout", request.nextUrl.origin), 307)
}
