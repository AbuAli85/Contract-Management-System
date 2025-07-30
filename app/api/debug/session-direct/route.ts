import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 Debug session-direct API called")

    // Create the same Supabase client that the middleware uses
    const supabase = await createClient()

    // Get session using the same method as middleware
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Also try to get the raw cookies to see what's being passed
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(
      (cookie) => cookie.name.includes("auth-token") || cookie.name.includes("sb-"),
    )

    const debugInfo = {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      cookies: cookies.length,
      authCookies: authCookies.map((c) => ({ name: c.name, length: c.value.length })),
      url: request.url,
      timestamp: new Date().toISOString(),
    }

    console.log("🔧 Debug session-direct result:", debugInfo)
    return NextResponse.json({ success: true, debug: debugInfo })
  } catch (error) {
    console.error("❌ Debug session-direct API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
