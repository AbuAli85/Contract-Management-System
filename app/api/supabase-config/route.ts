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

    // Get user if session exists
    let user = null
    if (session?.user) {
      const {
        data: { user: userData },
        error: userError,
      } = await supabase.auth.getUser()
      user = userData
    }

    return NextResponse.json({
      success: true,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        origin: request.nextUrl.origin,
      },
      session: {
        exists: !!session,
        error: sessionError?.message,
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
              emailConfirmed: !!session.user.email_confirmed_at,
              createdAt: session.user.created_at,
            }
          : null,
      },
      currentUser: user
        ? {
            id: user.id,
            email: user.email,
            emailConfirmed: !!user.email_confirmed_at,
            createdAt: user.created_at,
          }
        : null,
    })
  } catch (error) {
    console.error("Supabase config check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
