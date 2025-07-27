import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug cookies API called')
    
    const cookieStore = await cookies()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    
    // Filter auth-related cookies
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    )
    
    // Get specific auth cookies
    const specificCookies = {
      'sb-auth-token.0': await cookieStore.get('sb-auth-token.0'),
      'sb-auth-token.1': await cookieStore.get('sb-auth-token.1'),
      'sb-ekdjxzhujettocosgzql-auth-token.0': await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.0'),
      'sb-ekdjxzhujettocosgzql-auth-token.1': await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.1'),
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      totalCookies: allCookies.length,
      authCookies: authCookies.map(cookie => ({
        name: cookie.name,
        hasValue: !!cookie.value,
        valueLength: cookie.value?.length || 0,
        valuePreview: cookie.value ? `${cookie.value.substring(0, 20)}...` : null
      })),
      specificCookies: Object.fromEntries(
        Object.entries(specificCookies).map(([name, cookie]) => [
          name,
          cookie ? {
            hasValue: !!cookie.value,
            valueLength: cookie.value?.length || 0,
            valuePreview: cookie.value ? `${cookie.value.substring(0, 20)}...` : null
          } : null
        ])
      )
    }
    
    console.log('🔍 Debug cookies info:', debugInfo)
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
    
  } catch (error) {
    console.error('🔍 Debug cookies API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to debug cookies'
    }, { status: 500 })
  }
} 