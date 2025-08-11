import { NextRequest, NextResponse } from "next/server"
import { withRBAC, withAnyRBAC } from "@/lib/rbac/guard"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

const notificationSchema = z.object({
  user_id: z.string(),
  message: z.string(),
  is_read: z.boolean().default(false),
})

export const GET = withAnyRBAC(['notification:read:own', 'notification:read:organization'], async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const unread_only = searchParams.get("unread_only") === "true"

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

    // Build query
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    // Apply filters
    if (unread_only) {
      query = query.eq("is_read", false)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch notifications",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
})

export const POST = withRBAC('notification:create:own', async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = notificationSchema.parse(body)

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

    // Create notification
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([
        {
          ...validatedData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create notification",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: notification,
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

    console.error("Notifications API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id, read } = body

    if (typeof notification_id !== "string" || typeof read !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
        },
        { status: 400 },
      )
    }

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

    // Update notification
    const { data: notification, error } = await supabase
      .from("notifications")
      .update({ is_read: read })
      .eq("id", parseInt(notification_id))
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating notification:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update notification",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
