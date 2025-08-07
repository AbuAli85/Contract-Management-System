import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabaseServer"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log("🧪 Test Auth: User check:", { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message 
    })

    console.log("🧪 Test Auth: Session check:", { 
      hasSession: !!session, 
      sessionError: sessionError?.message 
    })

    if (authError || !user) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: authError?.message || "No user found",
        hasUser: false,
        hasSession: !!session
      }, { status: 401 })
    }

    // Try to get user profile
    let userProfile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single()

      if (!profileError && profileData) {
        userProfile = profileData
      }
    } catch (profileError) {
      console.log("⚠️ Test Auth: Profile check failed:", profileError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        profile: userProfile
      },
      session: {
        hasSession: !!session,
        sessionError: sessionError?.message
      },
      auth: {
        hasUser: true,
        authError: authError?.message
      }
    })

  } catch (error) {
    console.error("❌ Test Auth: Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
} 