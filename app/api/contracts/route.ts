import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Contracts API: Starting request...")
    
    const supabase = await createClient()
    
    // Check if we're using a mock client
    if (!supabase || typeof supabase.from !== 'function') {
      console.error("❌ Contracts API: Using mock client - environment variables may be missing")
      return NextResponse.json(
        {
          success: false,
          error: "Database connection not available. Please check environment variables.",
          details: "Mock client detected - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY may be missing",
        },
        { status: 503 },
      )
    }

    console.log("🔍 Contracts API: Fetching contracts from database...")

    // First, let's check if the contracts table exists and has data
    const { data: contracts, error: contractsError } = await supabase
      .from("contracts")
      .select(
        `
        id,
        contract_number,
        status,
        created_at,
        updated_at,
        start_date,
        end_date,
        job_title,
        work_location,
        value,
        employer_id,
        client_id,
        promoter_id,
        employer:parties!contracts_employer_id_fkey(id, name_en, name_ar, crn, type),
        client:parties!contracts_client_id_fkey(id, name_en, name_ar, crn, type),
        promoter:promoters!contracts_promoter_id_fkey(id, name_en, name_ar, id_card_number, status)
      `,
      )
      .order("created_at", { ascending: false })

    if (contractsError) {
      console.error("❌ Contracts API: Error fetching contracts:", contractsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch contracts",
          details: contractsError.message,
          code: contractsError.code,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Contracts API: Successfully fetched ${contracts?.length || 0} contracts`)

    // Get basic statistics
    const { count: totalContracts, error: countError } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("⚠️ Contracts API: Error counting contracts:", countError)
    }

    // Get status distribution
    const { data: statusData, error: statusError } = await supabase
      .from("contracts")
      .select("status")

    if (statusError) {
      console.error("⚠️ Contracts API: Error fetching status data:", statusError)
    }

    // Calculate statistics
    const stats = {
      total: totalContracts || 0,
      active: 0,
      expired: 0,
      upcoming: 0,
      unknown: 0,
      total_value: 0,
      avg_duration: 0,
    }

    if (statusData) {
      statusData.forEach((contract: { status: string }) => {
        switch (contract.status) {
          case "active":
            stats.active++
            break
          case "expired":
            stats.expired++
            break
          case "pending":
          case "legal_review":
          case "hr_review":
          case "final_approval":
          case "signature":
            stats.upcoming++
            break
          case "draft":
          case "generated":
            stats.unknown++
            break
          default:
            stats.unknown++
        }
      })
    }

    console.log("✅ Contracts API: Request completed successfully")

    return NextResponse.json({
      success: true,
      contracts: contracts || [],
      stats,
      total: totalContracts || 0,
    })
  } catch (error) {
    console.error("❌ Contracts API: Unexpected error:", error)
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

    // Prepare contract data
    const contractData = {
      contract_number: body.contract_number || `CON-${Date.now()}`,
      employer_id: body.employer_id,
      client_id: body.client_id,
      promoter_id: body.promoter_id,
      start_date: body.start_date,
      end_date: body.end_date,
      email: body.email,
      job_title: body.job_title,
      work_location: body.work_location,
      department: body.department,
      contract_type: body.contract_type,
      currency: body.currency,
      user_id: session.user.id,
      status: "draft",
    }

    // Insert the contract
    const { data: contract, error } = await supabase
      .from("contracts")
      .insert([contractData])
      .select()
      .single()

    if (error) {
      console.error("Error creating contract:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create contract",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      contract,
    })
  } catch (error) {
    console.error("Create contract error:", error)
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
