import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log('🔐 Check session API called')
    
    const supabase = await createClient()
    
    // Debug: Log available cookies
    const cookieStore = await cookies()
    const authToken0 = await cookieStore.get('sb-auth-token.0')
    const authToken1 = await cookieStore.get('sb-auth-token.1')
    const projectToken0 = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.0')
    const projectToken1 = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.1')
    
    console.log('🔐 Available cookies:', {
      hasToken0: !!authToken0,
      hasToken1: !!authToken1,
      hasProjectToken0: !!projectToken0,
      hasProjectToken1: !!projectToken1,
      token0Length: authToken0?.value?.length || 0,
      token1Length: authToken1?.value?.length || 0,
      projectToken0Length: projectToken0?.value?.length || 0,
      projectToken1Length: projectToken1?.value?.length || 0,
      token0Preview: authToken0?.value?.substring(0, 20) + '...',
      token1Preview: authToken1?.value?.substring(0, 20) + '...',
      projectToken0Preview: projectToken0?.value?.substring(0, 20) + '...',
      projectToken1Preview: projectToken1?.value?.substring(0, 20) + '...'
    })
    
    // Try to get session first
    console.log('🔐 Attempting to get session from Supabase...')
    
    // If we have tokens, try to set the session manually
    if (projectToken0?.value && projectToken1?.value) {
      console.log('🔐 Attempting to set session manually with tokens...')
      
      // Clean tokens by removing 'base64-' prefix if present
      let accessToken = projectToken0.value
      let refreshToken = projectToken1.value
      
      if (accessToken.startsWith('base64-')) {
        console.log('🔐 Removing base64- prefix from access token')
        accessToken = accessToken.substring(7) // Remove 'base64-' prefix
      }
      
      if (refreshToken.startsWith('base64-')) {
        console.log('🔐 Removing base64- prefix from refresh token')
        refreshToken = refreshToken.substring(7) // Remove 'base64-' prefix
      }
      
      console.log('🔐 Cleaned tokens:', {
        accessTokenPreview: accessToken.substring(0, 20) + '...',
        refreshTokenPreview: refreshToken.substring(0, 20) + '...'
      })
      
      const { data: { session: manualSession }, error: manualError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (manualSession) {
        console.log('🔐 Manual session set successfully for user:', manualSession.user.id)
        return NextResponse.json({
          success: true,
          hasSession: true,
          user: {
            id: manualSession.user.id,
            email: manualSession.user.email
          }
        })
      } else {
        console.log('🔐 Manual session set failed:', manualError?.message)
      }
    }
    
    // Fallback to normal session check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Session result:', session ? 'found' : 'not found')
    console.log('🔐 Session error:', sessionError ? sessionError.message : 'none')
    
    // Debug: Always try to decode the JWT token to see what's in it
    if (projectToken0?.value) {
      try {
        let tokenToDecode = projectToken0.value
        if (tokenToDecode.startsWith('base64-')) {
          tokenToDecode = tokenToDecode.substring(7)
        }
        
        const tokenParts = tokenToDecode.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
          console.log('🔐 JWT payload:', {
            exp: payload.exp,
            iat: payload.iat,
            sub: payload.sub,
            aud: payload.aud,
            iss: payload.iss,
            currentTime: Math.floor(Date.now() / 1000),
            isExpired: payload.exp < Math.floor(Date.now() / 1000)
          })
        }
      } catch (decodeError) {
        console.log('🔐 JWT decode error:', decodeError)
      }
    }
    
    if (sessionError) {
      console.log('🔐 Session error:', sessionError.message)
      return NextResponse.json({ 
        success: false, 
        hasSession: false, 
        error: sessionError.message 
      })
    }
    
    if (session && session.user) {
      console.log('🔐 Session found for user:', session.user.id)
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: session.user.id,
          email: session.user.email
        }
      })
    }
    
    console.log('🔐 Session not found, trying getUser()...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('🔐 User check error:', userError)
      return NextResponse.json({ 
        success: false, 
        hasSession: false, 
        error: userError.message 
      })
    }
    
    if (user) {
      console.log('🔐 User found:', user.id)
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: user.id,
          email: user.email
        }
      })
    }
    
    console.log('🔐 No session or user found')
    return NextResponse.json({ 
      success: false, 
      hasSession: false, 
      error: 'No session or user found' 
    })
    
  } catch (error) {
    console.error('🔐 Check session API error:', error)
    return NextResponse.json({ 
      success: false, 
      hasSession: false, 
      error: 'Internal server error' 
    })
  }
} 