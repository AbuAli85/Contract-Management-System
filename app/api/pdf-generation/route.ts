import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    console.log('🔍 PDF Generation API - Received request:', body)

    // Extract contract data
    const {
      contractId,
      contractNumber,
      first_party_id,
      second_party_id,
      promoter_id,
      contract_start_date,
      contract_end_date,
      email,
      job_title,
      work_location,
      department,
      contract_type,
      currency
    } = body

    // Validate required fields
    if (!contractId || !contractNumber) {
      return NextResponse.json({ 
        error: "Missing required fields: contractId, contractNumber" 
      }, { status: 400 })
    }

    // Simulate PDF generation (replace with actual PDF generation logic)
    const pdfUrl = `https://your-storage-service.com/contracts/${contractNumber}.pdf`
    
    // Update contract status to completed
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "completed",
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({ 
        error: "Failed to update contract status" 
      }, { status: 500 })
    }

    console.log('✅ PDF generated and contract updated:', contractId)

    return NextResponse.json({ 
      success: true, 
      pdf_url: pdfUrl,
      contract_number: contractNumber,
      status: "completed"
    })
  } catch (error) {
    console.error("PDF Generation API error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 