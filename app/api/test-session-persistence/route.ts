import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🧪 Test Session Persistence API called")

    const supabase = await createClient()

    // Test getSession
    console.log("🧪 Testing getSession...")
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Test getUser
    console.log("🧪 Testing getUser...")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    const testResults = {
      session: {
        exists: !!session,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        error: sessionError?.message || null,
      },
      user: {
        exists: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        error: userError?.message || null,
      },
      clientType: !process.env.NEXT_PUBLIC_SUPABASE_URL ? "mock" : "real",
      timestamp: new Date().toISOString(),
    }

    console.log("🧪 Test results:", testResults)

    return NextResponse.json({
      success: true,
      message: "Session persistence test completed",
      results: testResults,
      recommendations: {
        mock: "Should show session and user data for development",
        real: "Should show actual Supabase session data",
      },
    })
  } catch (error) {
    console.error("🧪 Session persistence test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
