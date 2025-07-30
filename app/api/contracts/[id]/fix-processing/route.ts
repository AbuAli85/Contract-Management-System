import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { contractGenerationService } from "@/lib/contract-generation-service"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractId } = await params
    const supabase = await createClient()

    // Get user session
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser()

    if (sessionError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in",
        },
        { status: 401 },
      )
    }

    console.log("🔧 Fixing stuck processing contract:", contractId)

    // Fix the stuck processing contract
    const success = await contractGenerationService.fixStuckProcessingContract(contractId)

    if (success) {
      // Get updated contract status
      const status = await contractGenerationService.getContractStatus(contractId)

      return NextResponse.json({
        success: true,
        message: "Contract processing status fixed successfully",
        data: status,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fix contract processing status",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Fix processing API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
