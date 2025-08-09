import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get available parties and promoters
    const { data: parties } = await supabase
      .from('parties')
      .select('id, name_en, type')
      .limit(10)
    
    const { data: promoters } = await supabase
      .from('promoters')
      .select('id, name_en')
      .limit(5)
    
    if (!parties?.length || !promoters?.length) {
      return NextResponse.json({ 
        error: 'No parties or promoters found. Please add some parties and promoters first.',
        parties_count: parties?.length || 0,
        promoters_count: promoters?.length || 0
      }, { status: 400 })
    }
    
    const clients = parties.filter(p => p.type === 'Client')
    const employers = parties.filter(p => p.type === 'Employer')
    
    if (!clients.length || !employers.length) {
      return NextResponse.json({ 
        error: 'Need both Client and Employer type parties to create contracts',
        clients_count: clients.length,
        employers_count: employers.length,
        total_parties: parties.length
      }, { status: 400 })
    }
    
    // Create contracts using the working schema from hooks
    const currentYear = new Date().getFullYear()
    const now = new Date()
    
    // Try the new schema first (as per the working hooks)
    const sampleContract = {
      first_party_id: clients[0].id,
      second_party_id: employers[0].id,
      promoter_id: promoters[0].id,
      contract_start_date: now.toISOString().split('T')[0],
      contract_end_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      job_title: 'Software Developer',
      contract_type: 'employment',
      status: 'active',
      contract_value: 45000,
      currency: 'OMR',
      email: 'developer@company.com',
      work_location: 'Muscat Office',
      department: 'IT Department',
      contract_number: `CNT-${currentYear}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      special_terms: 'Standard employment terms with probation period'
    }
    
    // Insert the contract
    const { data: createdContract, error: contractError } = await supabase
      .from('contracts')
      .insert([sampleContract])
      .select()
    
    if (contractError) {
      // If first_party_id fails, try the old schema
      const fallbackContract = {
        client_id: clients[0].id,
        employer_id: employers[0].id,
        promoter_id: promoters[0].id,
        start_date: now.toISOString().split('T')[0],
        end_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: 'Software Developer Contract',
        contract_type: 'employment',
        status: 'active',
        value: 45000,
        currency: 'OMR',
        terms: 'Standard employment terms with probation period',
        contract_number: `CNT-${currentYear}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      }
      
      const { data: fallbackCreated, error: fallbackError } = await supabase
        .from('contracts')
        .insert([fallbackContract])
        .select()
      
      if (fallbackError) {
        return NextResponse.json({
          error: 'Failed to create contract with both schemas',
          new_schema_error: contractError.message,
          old_schema_error: fallbackError.message,
          tried_schemas: ['first_party_id/second_party_id', 'client_id/employer_id']
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Sample contract created with fallback schema',
        contract: fallbackCreated?.[0],
        schema_used: 'old (client_id/employer_id)',
        parties: { clients: clients.length, employers: employers.length },
        promoters: promoters.length
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sample contract created successfully',
      contract: createdContract?.[0],
      schema_used: 'new (first_party_id/second_party_id)',
      parties: { clients: clients.length, employers: employers.length },
      promoters: promoters.length
    })
    
  } catch (error) {
    console.error('Error creating sample contract:', error)
    return NextResponse.json(
      { error: 'Failed to create sample contract', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}