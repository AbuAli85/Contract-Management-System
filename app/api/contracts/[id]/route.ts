import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch contract with related data
    const { data: contract, error } = await supabase
      .from("contracts")
      .select(`
        *,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
        promoter:promoters!contracts_promoter_id_fkey(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("API GET /contracts/[id] error:", error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }
      return NextResponse.json({ 
        error: 'Failed to fetch contract', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      contract 
    }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/contracts/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to edit contracts
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to edit contracts' }, { status: 403 })
    }

    // Parse the request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Build update payload with proper data types
    const dataToUpdate: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }

    // Add optional fields if they exist
    if (body.contract_start_date) dataToUpdate.contract_start_date = body.contract_start_date
    if (body.contract_end_date) dataToUpdate.contract_end_date = body.contract_end_date
    if (body.basic_salary !== undefined) dataToUpdate.basic_salary = body.basic_salary
    if (body.allowances !== undefined) dataToUpdate.allowances = body.allowances
    if (body.currency) dataToUpdate.currency = body.currency
    if (body.job_title) dataToUpdate.job_title = body.job_title
    if (body.department) dataToUpdate.department = body.department
    if (body.work_location) dataToUpdate.work_location = body.work_location
    if (body.email) dataToUpdate.email = body.email
    if (body.contract_type) dataToUpdate.contract_type = body.contract_type
    if (body.contract_number) dataToUpdate.contract_number = body.contract_number
    if (body.id_card_number) dataToUpdate.id_card_number = body.id_card_number
    if (body.special_terms) dataToUpdate.special_terms = body.special_terms

    console.log('🔄 Updating contract with data:', dataToUpdate)

    // Perform the update
    const { data: updated, error } = await supabase
      .from("contracts")
      .update(dataToUpdate)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("API PUT /contracts/[id] error:", error)
      return NextResponse.json({ 
        error: 'Update failed', 
        details: error.message 
      }, { status: 500 })
    }

    // Log the activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        action: 'contract_update',
        resource_type: 'contract',
        resource_id: id,
        details: { updated_fields: Object.keys(dataToUpdate) }
      })

    return NextResponse.json({ 
      success: true,
      message: "Contract updated successfully!", 
      contract: updated 
    }, { status: 200 })

  } catch (error) {
    console.error('Error in PUT /api/contracts/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
