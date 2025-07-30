import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    success: true,
    message: 'Auth configuration test',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseKeyLength: supabaseKey?.length || 0,
      supabaseUrlStart: supabaseUrl?.substring(0, 20) || 'not-set',
      supabaseKeyStart: supabaseKey?.substring(0, 20) || 'not-set'
    },
    clientType: !supabaseUrl || !supabaseKey ? 'mock' : 'real',
    recommendations: {
      development: 'Should use mock client for development',
      production: 'Should use real Supabase for production'
    }
  })
} 