import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test database connection and tables
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, contract_number, approval_status')
      .limit(5)

    const { data: approvals, error: approvalsError } = await supabase
      .from('contract_approvals')
      .select('*')
      .limit(5)

    const { data: reviewerRoles, error: rolesError } = await supabase
      .from('reviewer_roles')
      .select('*')
      .limit(5)

    const { data: workflowConfig, error: configError } = await supabase
      .from('workflow_config')
      .select('*')
      .limit(5)

    return NextResponse.json({
      success: true,
      message: 'Approval workflow test completed',
      data: {
        contracts: {
          count: contracts?.length || 0,
          sample: contracts,
          error: contractsError?.message
        },
        approvals: {
          count: approvals?.length || 0,
          sample: approvals,
          error: approvalsError?.message
        },
        reviewerRoles: {
          count: reviewerRoles?.length || 0,
          sample: reviewerRoles,
          error: rolesError?.message
        },
        workflowConfig: {
          count: workflowConfig?.length || 0,
          sample: workflowConfig,
          error: configError?.message
        }
      }
    })
  } catch (error) {
    console.error('Approval workflow test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test approval workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 