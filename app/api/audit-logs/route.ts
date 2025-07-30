import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const auditLogSchema = z.object({
  user_id: z.string().optional(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.number().optional(),
  details: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const action = searchParams.get("action")
    const user = searchParams.get("user")
    const resource_type = searchParams.get("resource_type")
    const from_date = searchParams.get("from_date")
    const to_date = searchParams.get("to_date")

    const supabase = await createClient()

    // Get user session for authorization
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in",
        },
        { status: 401 },
      )
    }

    // Check if user has admin role
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied - Admin role required",
        },
        { status: 403 },
      )
    }

    // Build query
    let query = supabase
      .from("audit_logs")
      .select(
        `
        *,
        user:profiles!audit_logs_user_id_fkey(
          id,
          full_name
        )
      `,
      )
      .order("created_at", { ascending: false })

    // Apply filters
    if (action) {
      query = query.eq("action", action)
    }
    if (user) {
      query = query.eq("user_id", user)
    }
    if (resource_type) {
      query = query.eq("entity_type", resource_type)
    }
    if (from_date) {
      query = query.gte("created_at", from_date)
    }
    if (to_date) {
      query = query.lte("created_at", to_date)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error("Error fetching audit logs:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch audit logs",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Audit logs API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = auditLogSchema.parse(body)

    const supabase = await createClient()

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in",
        },
        { status: 401 },
      )
    }

    // Get client IP and user agent
    const ip_address =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const user_agent = request.headers.get("user-agent") || "unknown"

    // Create audit log entry
    const { data: auditLog, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          ...validatedData,
          user_id: session.user.id,
          ip_address,
          user_agent,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating audit log:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create audit log",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: auditLog,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.format(),
        },
        { status: 400 },
      )
    }

    console.error("Audit logs API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
