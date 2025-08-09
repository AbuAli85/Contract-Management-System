import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get column information for contracts table
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'contracts' })
      .single()
    
    if (tableError) {
      // Fallback: try to query with different column names to see what works
      const tests = [
        { name: 'first_party_id + second_party_id', query: 'first_party_id, second_party_id' },
        { name: 'client_id + employer_id', query: 'client_id, employer_id' },
        { name: 'all columns', query: '*' }
      ]
      
      const results = []
      
      for (const test of tests) {
        try {
          const { error } = await supabase
            .from('contracts')
            .select(test.query)
            .limit(0)
          
          results.push({
            test: test.name,
            success: !error,
            error: error?.message || null
          })
        } catch (e) {
          results.push({
            test: test.name,
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error'
          })
        }
      }
      
      return NextResponse.json({
        message: 'Schema check results',
        tests: results,
        fallback_used: true
      })
    }
    
    return NextResponse.json({
      message: 'Table schema retrieved',
      schema: tableInfo,
      fallback_used: false
    })
    
  } catch (error) {
    console.error('Error checking schema:', error)
    return NextResponse.json(
      { error: 'Failed to check schema', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}