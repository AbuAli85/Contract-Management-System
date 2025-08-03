import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface HealthStatus {
  status: "healthy" | "unhealthy"
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: boolean
    auth: boolean
    api: boolean
  }
  errors: string[]
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: false,
      auth: false,
      api: false,
    },
    errors: [],
  }

  try {
    // Check 1: API endpoint is responding
    healthStatus.checks.api = true

    // Check 2: Database connectivity
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      try {
        // Test database connectivity using promoters table (which we know exists)
        const { error: dbError } = await supabase.from("promoters").select("id").limit(1)

        if (!dbError) {
          healthStatus.checks.database = true
        } else {
          healthStatus.errors.push(`Database error: ${dbError.message}`)
        }

        // Test auth service
        const { error: authError } = await supabase.auth.getSession()
        if (!authError) {
          healthStatus.checks.auth = true
        } else {
          healthStatus.errors.push(`Auth error: ${authError.message}`)
        }
      } catch (error) {
        healthStatus.errors.push(
          `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    } else {
      healthStatus.errors.push("Missing Supabase configuration")
    }
  } catch (error) {
    healthStatus.errors.push(
      `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }

  // Determine overall status - be more lenient
  const criticalChecksPassed = healthStatus.checks.api && healthStatus.checks.database
  healthStatus.status = criticalChecksPassed ? "healthy" : "unhealthy"

  const responseTime = Date.now() - startTime

  // Set appropriate status code - return 200 if critical checks pass
  const statusCode = criticalChecksPassed ? 200 : 503

  // Add response headers
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "X-Response-Time": `${responseTime}ms`,
    "X-Health-Check": "true",
  }

  return NextResponse.json(healthStatus, {
    status: statusCode,
    headers,
  })
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
