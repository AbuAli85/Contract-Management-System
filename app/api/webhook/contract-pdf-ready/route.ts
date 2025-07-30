import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { contractGenerationService } from "@/lib/contract-generation-service"

export async function POST(request: NextRequest) {
  try {
    console.log("📄 PDF Ready webhook received")

    const body = await request.json()
    console.log("📄 Webhook payload:", body)

    // Validate required fields
    const { contract_id, contract_number, pdf_url, google_drive_url, status } = body

    if (!contract_id && !contract_number) {
      return NextResponse.json(
        {
          success: false,
          error: "contract_id or contract_number is required",
        },
        { status: 400 },
      )
    }

    if (!pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: "pdf_url is required",
        },
        { status: 400 },
      )
    }

    // Update contract with PDF URL
    const success = await contractGenerationService.updateContractWithPDF(
      contract_id || contract_number,
      pdf_url,
      google_drive_url,
    )

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update contract",
        },
        { status: 500 },
      )
    }

    console.log("✅ Contract updated with PDF URL:", pdf_url)

    // Send success response
    return NextResponse.json({
      success: true,
      message: "Contract updated successfully",
      contract_id: contract_id || contract_number,
      pdf_url,
      status: status || "generated",
    })
  } catch (error) {
    console.error("❌ PDF Ready webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: "PDF Ready webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
