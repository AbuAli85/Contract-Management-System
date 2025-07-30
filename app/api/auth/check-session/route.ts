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
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("🔐 Auth Check: Error getting session:", error)
      return NextResponse.json(
        { 
          authenticated: false, 
          error: error.message 
        }, 
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { 
          authenticated: false, 
          user: null 
        }, 
        { status: 200 }
      )
    }

    // Return user info without sensitive data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at,
        user_metadata: session.user.user_metadata,
      },
      session: {
        access_token: session.access_token ? "***" : null,
        refresh_token: session.refresh_token ? "***" : null,
        expires_at: session.expires_at,
      },
    })
  } catch (error) {
    console.error("🔐 Auth Check: Unexpected error:", error)
    return NextResponse.json(
      { 
        authenticated: false, 
        error: "Internal server error" 
      }, 
      { status: 500 }
    )
  }
}
