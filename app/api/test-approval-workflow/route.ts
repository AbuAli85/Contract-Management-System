import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test database connection and tables
    const results = {
      contracts: { count: 0, sample: [], error: null as string | null },
      approvals: { count: 0, sample: [], error: null as string | null },
      reviewerRoles: { count: 0, sample: [], error: null as string | null },
      workflowConfig: { count: 0, sample: [], error: null as string | null },
      users: { count: 0, sample: [], error: null as string | null }
    }

    // Test contracts table
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, contract_number, approval_status')
        .limit(5)

      results.contracts = {
        count: contracts?.length || 0,
        sample: contracts || [],
        error: contractsError?.message || null
      }
    } catch (error) {
      results.contracts.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test contract_approvals table
    try {
      const { data: approvals, error: approvalsError } = await supabase
        .from('contract_approvals')
        .select('*')
        .limit(5)

      results.approvals = {
        count: approvals?.length || 0,
        sample: approvals || [],
        error: approvalsError?.message || null
      }
    } catch (error) {
      results.approvals.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test reviewer_roles table
    try {
      const { data: reviewerRoles, error: rolesError } = await supabase
        .from('reviewer_roles')
        .select('*')
        .limit(5)

      results.reviewerRoles = {
        count: reviewerRoles?.length || 0,
        sample: reviewerRoles || [],
        error: rolesError?.message || null
      }
    } catch (error) {
      results.reviewerRoles.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test workflow_config table
    try {
      const { data: workflowConfig, error: configError } = await supabase
        .from('workflow_config')
        .select('*')
        .limit(5)

      results.workflowConfig = {
        count: workflowConfig?.length || 0,
        sample: workflowConfig || [],
        error: configError?.message || null
      }
    } catch (error) {
      results.workflowConfig.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test users table
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(5)

      results.users = {
        count: users?.length || 0,
        sample: users || [],
        error: usersError?.message || null
      }
    } catch (error) {
      results.users.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      success: true,
      message: 'Approval workflow test completed',
      data: results,
      summary: {
        totalTables: 5,
        tablesWithData: Object.values(results).filter(r => r.count > 0).length,
        tablesWithErrors: Object.values(results).filter(r => r.error).length
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