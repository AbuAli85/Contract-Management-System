import { NextResponse } from "next/server"

export async function GET() {
  try {
    const testData = {
      contractId: "test-contract-id",
      contractNumber: "PAC-23072024-TEST",
      first_party_id: "test-party-a",
      second_party_id: "test-party-b",
      promoter_id: "test-promoter",
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      email: "test@example.com",
      job_title: "Software Engineer",
      work_location: "Remote",
      department: "Engineering",
      contract_type: "full-time",
      currency: "OMR",
      update_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-contract`
    }

    // Test the contract generation webhook
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ 
        error: "MAKE_WEBHOOK_URL not configured" 
      }, { status: 500 })
    }

    console.log('🧪 Testing contract generation webhook:', webhookUrl)
    console.log('🧪 Test data:', testData)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Webhook test failed:', response.status, errorText)
      return NextResponse.json({ 
        error: `Webhook test failed: ${response.status} ${errorText}` 
      }, { status: 500 })
    }

    const result = await response.json()
    console.log('✅ Webhook test successful:', result)

    return NextResponse.json({ 
      success: true, 
      message: "Contract generation webhook test completed",
      result 
    })
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 