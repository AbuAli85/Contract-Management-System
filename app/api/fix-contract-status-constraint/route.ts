import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing contract status constraint...')
    
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can fix database constraints' }, { status: 403 })
    }

    // SQL to fix the constraint
    const fixSQL = `
      DO $$
      BEGIN
        -- Drop existing constraint if it exists
        ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
        
        -- Add new constraint with 'approved' status included
        ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
          CHECK (status IN ('draft', 'active', 'pending', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected'));
      END $$;
    `

    // Execute the fix
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL })

    if (error) {
      console.error('❌ Error fixing constraint:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fix constraint',
        details: error.message 
      }, { status: 500 })
    }

    // Verify the fix
    const { data: constraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_name', 'contracts_status_check')

    if (checkError) {
      console.warn('⚠️ Could not verify constraint:', checkError.message)
    }

    console.log('✅ Contract status constraint fixed successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Contract status constraint fixed successfully',
      constraint: constraints?.[0]?.check_clause || 'Unknown'
    })

  } catch (error) {
    console.error('❌ Error in fix-contract-status-constraint:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 