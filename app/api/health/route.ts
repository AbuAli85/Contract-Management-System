import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Health Check: Starting...")
    
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    console.log("🔍 Health Check: Environment variables:", envVars)
    
    const supabase = await createClient()
    
    // Check if we're using a mock client
    const isMockClient = !supabase || typeof supabase.from !== 'function'
    
    if (isMockClient) {
      console.warn("⚠️ Health Check: Using mock client")
      return NextResponse.json({
        status: "warning",
        message: "Using mock client - environment variables may be missing",
        environment: envVars,
        timestamp: new Date().toISOString(),
      })
    }
    
    // Test database connection
    const { data, error } = await supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
    
    if (error) {
      console.error("❌ Health Check: Database connection failed:", error)
      return NextResponse.json({
        status: "error",
        message: "Database connection failed",
        error: error.message,
        code: error.code,
        environment: envVars,
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }
    
    console.log("✅ Health Check: All systems operational")
    return NextResponse.json({
      status: "healthy",
      message: "All systems operational",
      database: "connected",
      environment: envVars,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error("❌ Health Check: Unexpected error:", error)
    return NextResponse.json({
      status: "error",
      message: "Health check failed",
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
