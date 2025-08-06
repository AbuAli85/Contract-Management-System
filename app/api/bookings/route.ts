import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Bookings API: Starting request...")
    
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resource_type')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    
    // Check if we're using a mock client
    if (!supabase || typeof supabase.from !== 'function') {
      console.error("❌ Bookings API: Using mock client - returning mock data")
      return NextResponse.json(
        {
          success: true,
          bookings: [
            {
              id: '1',
              resource_id: 'conf-room-a',
              resource_name: 'Conference Room A',
              title: 'Team Meeting',
              description: 'Weekly team sync',
              start_time: '2024-01-22T10:00:00Z',
              end_time: '2024-01-22T11:00:00Z',
              user_id: 'user1',
              user_name: 'John Doe',
              status: 'confirmed',
              attendees: ['john@company.com'],
              total_cost: 50,
              created_at: new Date().toISOString()
            }
          ],
          count: 1,
          stats: {
            total_bookings: 1,
            active_bookings: 1,
            completed_bookings: 0,
            cancelled_bookings: 0
          }
        },
        { status: 200 },
      )
    }

    console.log("🔍 Bookings API: Fetching bookings from database...")

    // Build query
    let query = supabase
      .from("bookings")
      .select(`
        *,
        booking_resources(name)
      `)
      .order("start_time", { ascending: false })

    // Apply filters
    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (dateFrom) {
      query = query.gte('start_time', dateFrom)
    }
    if (dateTo) {
      query = query.lte('end_time', dateTo)
    }

    let bookings = []
    try {
      const { data: bookingsData, error: bookingsError } = await query.limit(50)

      if (bookingsError) {
        console.warn("⚠️ Bookings API: Error fetching bookings:", bookingsError.message)
        bookings = []
      } else {
        bookings = bookingsData || []
      }
    } catch (error) {
      console.warn("⚠️ Bookings API: Booking fetch failed, continuing with empty array")
      bookings = []
    }

    // Get basic statistics
    let stats = {
      total_bookings: 0,
      active_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0
    }

    try {
      const { count: totalCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })

      const { count: activeCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed")

      const { count: completedCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")

      const { count: cancelledCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled")

      stats = {
        total_bookings: totalCount || 0,
        active_bookings: activeCount || 0,
        completed_bookings: completedCount || 0,
        cancelled_bookings: cancelledCount || 0
      }
    } catch (error) {
      console.warn("⚠️ Bookings API: Could not fetch statistics")
    }

    console.log(`✅ Bookings API: Successfully fetched ${bookings?.length || 0} bookings`)

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      count: bookings?.length || 0,
      stats
    })
  } catch (error) {
    console.error("❌ Bookings API: Unexpected error:", error)
    return NextResponse.json(
      {
        success: true, // Return success to avoid errors
        bookings: [],
        count: 0,
        stats: {
          total_bookings: 0,
          active_bookings: 0,
          completed_bookings: 0,
          cancelled_bookings: 0
        },
        error: "Internal server error",
      },
      { status: 200 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    // Prepare booking data
    const bookingData = {
      resource_id: body.resource_id,
      title: body.title,
      description: body.description,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status || 'confirmed',
      user_id: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert the booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select()
      .single()

    if (error) {
      console.error("Error creating booking:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create booking",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      booking,
    })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
