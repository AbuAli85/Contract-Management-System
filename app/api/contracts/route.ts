import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // First, let's check if the contracts table exists and has data
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        status,
        created_at,
        updated_at,
        contract_start_date,
        contract_end_date,
        job_title,
        work_location,
        contract_value,
        first_party_id,
        second_party_id,
        promoter_id,
        first_party:parties!contracts_first_party_id_fkey(id, name_en, name_ar, crn, type),
        second_party:parties!contracts_second_party_id_fkey(id, name_en, name_ar, crn, type),
        promoters:promoters!contracts_promoter_id_fkey(id, name_en, name_ar, id_card_number, status)
      `)
      .order('created_at', { ascending: false })

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch contracts',
        details: contractsError.message
      }, { status: 500 })
    }

    // Get basic statistics
    const { count: totalContracts, error: countError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting contracts:', countError)
    }

    // Get status distribution
    const { data: statusData, error: statusError } = await supabase
      .from('contracts')
      .select('status')

    if (statusError) {
      console.error('Error fetching status data:', statusError)
    }

    // Calculate statistics
    const stats = {
      total: totalContracts || 0,
      active: 0,
      expired: 0,
      upcoming: 0,
      unknown: 0,
      total_value: 0,
      avg_duration: 0
    }

    if (statusData) {
      statusData.forEach(contract => {
        switch (contract.status) {
          case 'active':
            stats.active++
            break
          case 'expired':
            stats.expired++
            break
          case 'pending':
          case 'legal_review':
          case 'hr_review':
          case 'final_approval':
          case 'signature':
            stats.upcoming++
            break
          case 'draft':
          case 'generated':
            stats.unknown++
            break
          default:
            stats.unknown++
        }
      })
    }

    return NextResponse.json({
      success: true,
      contracts: contracts || [],
      stats,
      total: totalContracts || 0
    })

  } catch (error) {
    console.error('Contracts API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Prepare contract data
    const contractData = {
      contract_number: body.contract_number || `CON-${Date.now()}`,
      first_party_id: body.first_party_id,
      second_party_id: body.second_party_id,
      promoter_id: body.promoter_id,
      contract_start_date: body.contract_start_date,
      contract_end_date: body.contract_end_date,
      email: body.email,
      job_title: body.job_title,
      work_location: body.work_location,
      department: body.department,
      contract_type: body.contract_type,
      currency: body.currency,
      user_id: session.user.id,
      status: 'draft'
    }

    // Insert the contract
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single()

    if (error) {
      console.error('Error creating contract:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create contract',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contract
    })

  } catch (error) {
    console.error('Create contract error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 })
  }
}