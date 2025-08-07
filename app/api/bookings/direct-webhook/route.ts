import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Make.com webhook URL (can be configured via environment variable)
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_BOOKING_CREATED || 'https://hook.eu2.make.com/1unm44xv23srammipy0j1cauawrkzn32'

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Creating new booking with immediate Make.com webhook...")
    
    const supabase = await createClient()
    
    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - please log in",
        },
        { status: 401 },
      )
    }

    // Parse request body
    const { resource_id, title, description, start_time, end_time, total_cost, attendees } = await request.json()

    // Validate required fields
    if (!resource_id || !title || !start_time || !end_time) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: resource_id, title, start_time, end_time",
        },
        { status: 400 },
      )
    }

    // Prepare booking data
    const bookingData = {
      resource_id,
      title,
      description: description || '',
      start_time,
      end_time,
      user_id: session.user.id,
      status: 'confirmed',
      total_cost: total_cost || 0,
      attendees: attendees || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log("📝 Inserting booking into database...")

    // 1) Insert the booking into Supabase
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()

    if (insertError) {
      console.error("❌ Database insert failed:", insertError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create booking",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Booking created successfully:", booking.id)

    // 2) Immediately call Make.com webhook with the new booking data
    try {
      console.log("🔔 Calling Make.com webhook directly...")
      
      const webhookPayload = {
        event: 'booking.created',
        booking_id: booking.id,
        resource_id: booking.resource_id,
        title: booking.title,
        description: booking.description,
        start_time: booking.start_time,
        end_time: booking.end_time,
        user_id: booking.user_id,
        status: booking.status,
        total_cost: booking.total_cost,
        attendees: booking.attendees,
        created_at: booking.created_at,
        webhook_timestamp: new Date().toISOString(),
        source: 'contract-management-system'
      }

      const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'ContractManagementSystem/1.0'
        },
        body: JSON.stringify(webhookPayload)
      })

      if (makeResponse.ok) {
        const makeResponseData = await makeResponse.text()
        console.log("✅ Make.com webhook called successfully:", makeResponseData)
        
        // Optionally log the successful webhook call
        try {
          await supabase.from('webhook_logs').insert({
            webhook_type: 'booking.created',
            booking_id: booking.id,
            payload: webhookPayload,
            response: makeResponseData ? JSON.parse(makeResponseData) : null,
            status: 'success',
            processed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
        } catch (logError) {
          console.warn("⚠️ Could not log successful webhook:", logError)
        }
      } else {
        const errorText = await makeResponse.text()
        console.error("❌ Make.com webhook failed:", errorText)
        
        // Log the webhook failure
        try {
          await supabase.from('webhook_logs').insert({
            webhook_type: 'booking.created',
            booking_id: booking.id,
            payload: webhookPayload,
            status: 'error',
            error_message: `HTTP ${makeResponse.status}: ${errorText}`,
            created_at: new Date().toISOString()
          })
        } catch (logError) {
          console.warn("⚠️ Could not log webhook error:", logError)
        }
        
        // Note: We don't fail the booking creation if webhook fails
        console.warn("⚠️ Booking created but webhook notification failed")
      }
    } catch (webhookError) {
      console.error("❌ Make.com webhook error:", webhookError)
      
      // Log the webhook error
      try {
        await supabase.from('webhook_logs').insert({
          webhook_type: 'booking.created',
          booking_id: booking.id,
          payload: { error: 'Webhook call failed' },
          status: 'error',
          error_message: webhookError instanceof Error ? webhookError.message : 'Unknown webhook error',
          created_at: new Date().toISOString()
        })
      } catch (logError) {
        console.warn("⚠️ Could not log webhook error:", logError)
      }
      
      // You can decide whether this should block your API response
      // In this case, we'll proceed since the booking was created successfully
      console.warn("⚠️ Booking created but webhook notification failed")
    }

    // Return the successful booking creation
    return NextResponse.json({
      success: true,
      booking,
      webhook_notified: true, // This indicates whether webhook was attempted
      message: "Booking created successfully and Make.com notified"
    })

  } catch (error) {
    console.error("❌ Booking creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// Also keep the GET method for fetching bookings
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching bookings...")
    
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resource_type')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

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

    const { data: bookings, error } = await query.limit(50)

    if (error) {
      console.error("❌ Error fetching bookings:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch bookings",
          details: error.message
        },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully fetched ${bookings?.length || 0} bookings`)

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      count: bookings?.length || 0
    })

  } catch (error) {
    console.error("❌ Fetch bookings error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
