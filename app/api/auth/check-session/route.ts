import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    // Try getUser() first for better security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      // Only log significant errors, not expected "Auth session missing!" messages
      if (!userError.message.includes("Auth session missing")) {
        console.log("🔐 User check error:", userError.message)
      }
    } else if (user) {
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: user.id,
          email: user.email,
        },
      })
    }

    // Fallback to getSession() if getUser() fails
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Only log significant errors
      if (!sessionError.message.includes("Auth session missing")) {
        console.log("🔐 Session error:", sessionError.message)
      }
      return NextResponse.json({
        success: false,
        hasSession: false,
        error: sessionError.message,
      })
    }

    if (session) {
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      })
    }

    return NextResponse.json({
      success: false,
      hasSession: false,
      error: "No session found",
    })
  } catch (error) {
    console.error("🔐 Check session API error:", error)
    return NextResponse.json({
      success: false,
      hasSession: false,
      error: "Internal server error",
    })
  }
}
