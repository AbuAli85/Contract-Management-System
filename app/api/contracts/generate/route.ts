import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contractGenerationService, type ContractGenerationRequest } from '@/lib/contract-generation-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Contract generation API called')
    
    // Get user session
    const supabase = await createClient()
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
          if (sessionError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    console.log('📝 Request body:', body)

    // Validate required fields
    const requiredFields = [
      'first_party_id', 'second_party_id', 'promoter_id', 
      'contract_start_date', 'contract_end_date', 'email',
      'job_title', 'work_location', 'department', 'contract_type', 'currency'
    ]

    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Prepare contract data
    const contractData: ContractGenerationRequest = {
      first_party_id: body.first_party_id,
      second_party_id: body.second_party_id,
      promoter_id: body.promoter_id,
      contract_start_date: new Date(body.contract_start_date),
      contract_end_date: new Date(body.contract_end_date),
      email: body.email,
      job_title: body.job_title,
      work_location: body.work_location,
      department: body.department,
      contract_type: body.contract_type,
      currency: body.currency,
      basic_salary: body.basic_salary,
      allowances: body.allowances,
      special_terms: body.special_terms
    }

    // Generate contract using the service
    const result = await contractGenerationService.generateContract(contractData)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
        details: result.errors
      }, { status: 400 })
    }

    console.log('✅ Contract generated successfully:', result.contract_id)

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message
    })

  } catch (error) {
    console.error('❌ Contract generation API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contract_id')
    const action = searchParams.get('action')

    if (!contractId) {
      return NextResponse.json({
        success: false,
        error: 'Contract ID is required'
      }, { status: 400 })
    }

    // Get user session
    const supabase = await createClient()
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
    if (sessionError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    if (action === 'status') {
      // Get contract status
      const status = await contractGenerationService.getContractStatus(contractId)
      
      if (!status) {
        return NextResponse.json({
          success: false,
          error: 'Contract not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: status
      })
    }

    if (action === 'download') {
      // Download contract PDF
      const downloadResult = await contractGenerationService.downloadContractPDF(contractId)
      
      if (!downloadResult.success) {
        return NextResponse.json({
          success: false,
          error: downloadResult.error
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          download_url: downloadResult.url
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Contract API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { contract_id, action } = body

    if (!contract_id) {
      return NextResponse.json({
        success: false,
        error: 'Contract ID is required'
      }, { status: 400 })
    }

    // Get user session
    const supabase = await createClient()
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
    if (sessionError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    if (action === 'retry') {
      // Retry contract generation
      const success = await contractGenerationService.retryContractGeneration(contract_id)
      
      return NextResponse.json({
        success,
        message: success 
          ? 'Contract generation retry initiated' 
          : 'Failed to retry contract generation'
      })
    }

    if (action === 'update_pdf') {
      // Update contract with PDF URL (called by Make.com webhook)
      const { pdf_url, google_drive_url } = body
      
      if (!pdf_url) {
        return NextResponse.json({
          success: false,
          error: 'PDF URL is required'
        }, { status: 400 })
      }

      const success = await contractGenerationService.updateContractWithPDF(contract_id, pdf_url, google_drive_url)
      
      return NextResponse.json({
        success,
        message: success 
          ? 'Contract updated with PDF URL' 
          : 'Failed to update contract'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Contract API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 