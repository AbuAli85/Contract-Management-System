import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔧 Test dashboard API called')
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard API is working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test dashboard API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 