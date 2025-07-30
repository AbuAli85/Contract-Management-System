import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      )
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          success: false,
          error: "Only CSV files are supported",
        },
        { status: 400 },
      )
    }

    // Read and parse CSV file
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file must have at least a header and one data row",
        },
        { status: 400 },
      )
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    const dataRows = lines.slice(1)

    let processed = 0
    let errors = 0

    // Process each row based on file type (determined by headers)
    if (headers.includes("name_en") && headers.includes("crn")) {
      // This is a parties CSV
      for (const row of dataRows) {
        try {
          const values = row.split(",").map((v) => v.trim())
          const partyData: any = {}

          headers.forEach((header, index) => {
            if (values[index]) {
              partyData[header] = values[index]
            }
          })

          // Add created_by
          partyData.created_by = session.user.id

          const { error } = await supabase.from("parties").insert([partyData])

          if (error) {
            console.error("Error inserting party:", error)
            errors++
          } else {
            processed++
          }
        } catch (error) {
          console.error("Error processing row:", error)
          errors++
        }
      }
    } else if (headers.includes("name_en") && headers.includes("id_card_number")) {
      // This is a promoters CSV
      for (const row of dataRows) {
        try {
          const values = row.split(",").map((v) => v.trim())
          const promoterData: any = {}

          headers.forEach((header, index) => {
            if (values[index]) {
              promoterData[header] = values[index]
            }
          })

          // Add created_by
          promoterData.created_by = session.user.id

          const { error } = await supabase.from("promoters").insert([promoterData])

          if (error) {
            console.error("Error inserting promoter:", error)
            errors++
          } else {
            processed++
          }
        } catch (error) {
          console.error("Error processing row:", error)
          errors++
        }
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported CSV format. Please use parties or promoters template.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      message: `Successfully processed ${processed} records with ${errors} errors`,
    })
  } catch (error) {
    console.error("Bulk import API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
