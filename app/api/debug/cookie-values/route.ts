import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Debug cookie values API called')
    
    const allCookies = request.cookies.getAll()
    
    // Get the auth token cookies specifically
    const authToken0 = request.cookies.get('sb-auth-token.0')
    const authToken1 = request.cookies.get('sb-auth-token.1')
    
    const debugInfo = {
      totalCookies: allCookies.length,
      allCookieNames: allCookies.map(c => c.name),
      authToken0: {
        exists: !!authToken0,
        value: authToken0 ? authToken0.value.substring(0, 50) + '...' : null,
        fullValue: authToken0 ? authToken0.value : null,
        length: authToken0 ? authToken0.value.length : 0
      },
      authToken1: {
        exists: !!authToken1,
        value: authToken1 ? authToken1.value.substring(0, 50) + '...' : null,
        fullValue: authToken1 ? authToken1.value : null,
        length: authToken1 ? authToken1.value.length : 0
      },
      timestamp: new Date().toISOString()
    }

    console.log('🔧 Debug cookie values result:', {
      ...debugInfo,
      authToken0: { ...debugInfo.authToken0, fullValue: 'HIDDEN' },
      authToken1: { ...debugInfo.authToken1, fullValue: 'HIDDEN' }
    })

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error) {
    console.error('❌ Debug cookie values API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 