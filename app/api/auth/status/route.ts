import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    const authStatus = {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      auth: authStatus,
    })
  } catch (error) {
    console.error("Auth status error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check authentication status",
      },
      { status: 500 },
    )
  }
}
