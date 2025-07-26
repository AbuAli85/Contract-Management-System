import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const supabase = await createClient()
    
    console.log('🧪 Testing database connection...')
    
    const results = {
      connectionTime: 0,
      authTime: 0,
      usersQueryTime: 0,
      profilesQueryTime: 0,
      promotersQueryTime: 0,
      contractsQueryTime: 0,
      totalTime: 0,
      errors: [] as string[]
    }
    
    // Test 1: Basic connection and auth
    const authStart = Date.now()
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      results.authTime = Date.now() - authStart
      
      if (authError) {
        results.errors.push(`Auth error: ${authError.message}`)
      }
    } catch (error) {
      results.errors.push(`Auth failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    // Test 2: Users table query (minimal fields)
    const usersStart = Date.now()
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(5)
      
      results.usersQueryTime = Date.now() - usersStart
      
      if (usersError) {
        results.errors.push(`Users query error: ${usersError.message}`)
      }
    } catch (error) {
      results.errors.push(`Users query failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    // Test 3: Profiles table query (minimal fields)
    const profilesStart = Date.now()
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(5)
      
      results.profilesQueryTime = Date.now() - profilesStart
      
      if (profilesError) {
        results.errors.push(`Profiles query error: ${profilesError.message}`)
      }
    } catch (error) {
      results.errors.push(`Profiles query failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    // Test 4: Promoters table query (minimal fields)
    const promotersStart = Date.now()
    try {
      const { data: promoters, error: promotersError } = await supabase
        .from('promoters')
        .select('id, name_en')
        .limit(5)
      
      results.promotersQueryTime = Date.now() - promotersStart
      
      if (promotersError) {
        results.errors.push(`Promoters query error: ${promotersError.message}`)
      }
    } catch (error) {
      results.errors.push(`Promoters query failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    // Test 5: Contracts table query (minimal fields)
    const contractsStart = Date.now()
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, title')
        .limit(5)
      
      results.contractsQueryTime = Date.now() - contractsStart
      
      if (contractsError) {
        results.errors.push(`Contracts query error: ${contractsError.message}`)
      }
    } catch (error) {
      results.errors.push(`Contracts query failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    results.totalTime = Date.now() - startTime
    
    // Performance analysis
    const performance = {
      auth: results.authTime < 1000 ? 'Good' : results.authTime < 3000 ? 'Slow' : 'Very Slow',
      users: results.usersQueryTime < 1000 ? 'Good' : results.usersQueryTime < 3000 ? 'Slow' : 'Very Slow',
      profiles: results.profilesQueryTime < 1000 ? 'Good' : results.profilesQueryTime < 3000 ? 'Slow' : 'Very Slow',
      promoters: results.promotersQueryTime < 1000 ? 'Good' : results.promotersQueryTime < 3000 ? 'Slow' : 'Very Slow',
      contracts: results.contractsQueryTime < 1000 ? 'Good' : results.contractsQueryTime < 3000 ? 'Slow' : 'Very Slow',
      overall: results.totalTime < 3000 ? 'Good' : results.totalTime < 8000 ? 'Slow' : 'Very Slow'
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database performance test completed',
      results: {
        authTime: `${results.authTime}ms`,
        usersQueryTime: `${results.usersQueryTime}ms`,
        profilesQueryTime: `${results.profilesQueryTime}ms`,
        promotersQueryTime: `${results.promotersQueryTime}ms`,
        contractsQueryTime: `${results.contractsQueryTime}ms`,
        totalTime: `${results.totalTime}ms`,
        errors: results.errors
      },
      performance,
      recommendations: results.errors.length > 0 ? 
        'Database has errors - check connection and permissions' :
        performance.overall === 'Very Slow' ? 
          'Database is very slow - consider optimization or upgrading' :
          performance.overall === 'Slow' ? 
            'Database is slow - monitor performance' : 
            'Database performance is good'
    })
    
  } catch (error) {
    console.error('Error in database connection test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Database connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 