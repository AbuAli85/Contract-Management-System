import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Force logout API called')
    
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear all auth-related cookies
    const cookiesToClear = [
      'sb-auth-token.0',
      'sb-auth-token.1',
      'sb-auth-token.2',
      'sb-auth-token.3',
      'sb-auth-token.4'
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/'
      })
    })

    console.log('🔧 Cleared auth cookies')

    return response
  } catch (error) {
    console.error('❌ Force logout API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 