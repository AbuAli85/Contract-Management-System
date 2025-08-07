import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AuthErrorHandler } from "@/lib/auth-error-handler"
import { ApiErrorHandler } from "@/lib/api-error-handler"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { createAuditLog, logAuditEvent } from "@/lib/security"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

async function loginHandler(request: NextRequest) {
  try {
    console.log("🔐 Server login API called")

    const { email, password } = await request.json()

    if (!email || !password) {
      const error = AuthErrorHandler.createError(
        "Email and password are required",
        "VALIDATION_ERROR",
      )
      
      // Log failed validation attempt
      const auditEntry = createAuditLog(
        request,
        'LOGIN_VALIDATION_FAILED',
        false,
        { email: email || 'missing', reason: 'missing_credentials' }
      )
      logAuditEvent(auditEntry)
      
      return NextResponse.json(error, { status: 400 })
    }

    const supabase = await createClient()

    console.log("🔐 Attempting server-side sign in...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("🔐 Server login error:", error)
      const apiError = ApiErrorHandler.handleAuthError(error)
      
      // Log failed login attempt
      const auditEntry = createAuditLog(
        request,
        'LOGIN_FAILED',
        false,
        { 
          email, 
          error: error.message,
          errorCode: error.status 
        }
      )
      logAuditEvent(auditEntry)
      
      return NextResponse.json(ApiErrorHandler.formatErrorResponse(apiError), { status: apiError.status || 400 })
    }

    if (!data.user) {
      console.error("🔐 No user returned from sign in")
      const error = AuthErrorHandler.createError("Authentication failed", "AUTH_FAILED")
      
      // Log authentication failure
      const auditEntry = createAuditLog(
        request,
        'LOGIN_AUTH_FAILED',
        false,
        { email, reason: 'no_user_returned' }
      )
      logAuditEvent(auditEntry)
      
      return NextResponse.json(error, { status: 400 })
    }

    console.log("🔐 Server login successful for user:", data.user.id)

    // Log successful login
    const auditEntry = createAuditLog(
      request,
      'LOGIN_SUCCESS',
      true,
      { 
        userId: data.user.id,
        email: data.user.email,
        sessionId: data.session?.access_token?.substring(0, 10) + '...'
      }
    )
    logAuditEvent(auditEntry)

    // Debug: Log session details
    if (data.session) {
      console.log("🔐 Session details:", {
        accessTokenLength: data.session.access_token?.length || 0,
        refreshTokenLength: data.session.refresh_token?.length || 0,
        accessTokenPreview: data.session.access_token?.substring(0, 50) + "...",
        refreshTokenPreview: data.session.refresh_token?.substring(0, 50) + "...",
        expiresAt: data.session.expires_at,
        tokenType: data.session.token_type,
      })
    }

    // Create response with success
    const response = NextResponse.json(
      AuthErrorHandler.createSuccess(
        {
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        },
        "Login successful",
      ),
    )

    // Let Supabase handle cookie management automatically
    // The createClient() function will handle setting the appropriate cookies
    console.log("🔐 Login completed, cookies should be set by Supabase")

    return response
  } catch (error) {
    console.error("🔐 Server login API error:", error)
    
    // Log unexpected error
    const auditEntry = createAuditLog(
      request,
      'LOGIN_ERROR',
      false,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    )
    logAuditEvent(auditEntry)
    
    const apiError = AuthErrorHandler.handleGenericError(error)
    return NextResponse.json(apiError, { status: 500 })
  }
}

// Export the rate-limited handler
export const POST = withRateLimit(loginHandler, RATE_LIMITS.auth)
