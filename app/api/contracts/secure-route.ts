import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withSecurity } from "@/lib/security/api-middleware"
import { rateLimitPresets } from "@/lib/security/rate-limiter"
import { validateInput, VALIDATION_PRESETS } from "@/lib/security/input-sanitizer"
import { auditLogger } from "@/lib/security/audit-logger"
import { databaseSecurity, SENSITIVE_FIELDS } from "@/lib/security/data-encryption"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

// Secured GET endpoint - Fetch contracts with proper security
export const GET = withSecurity(
  async (request: NextRequest) => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Log the request
      await auditLogger.logUserAction('contracts.list', user?.id || 'anonymous')

      // Get query parameters with validation
      const { searchParams } = new URL(request.url)
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
      const status = searchParams.get('status')
      const search = searchParams.get('search')

      // Validate search input if provided
      if (search) {
        const searchValidation = validateInput(search, {
          type: 'string',
          maxLength: 100,
          noHTML: true,
          noSQL: true
        })
        
        if (!searchValidation.isValid) {
          return NextResponse.json({
            success: false,
            error: 'Invalid search parameters',
            details: searchValidation.errors
          }, { status: 400 })
        }
      }

      // Build query with proper filtering
      let query = supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          status,
          created_at,
          updated_at,
          contract_start_date,
          contract_end_date,
          job_title,
          work_location,
          contract_value,
          first_party_id,
          second_party_id,
          promoter_id,
          first_party:parties!contracts_first_party_id_fkey(id, name_en, name_ar, crn, type),
          second_party:parties!contracts_second_party_id_fkey(id, name_en, name_ar, crn, type),
          promoters:promoters!contracts_promoter_id_fkey(id, name_en, name_ar, id_card_number, status)
        `)
        .order("created_at", { ascending: false })

      // Apply filters
      if (status && ['active', 'pending', 'completed', 'cancelled'].includes(status)) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`contract_number.ilike.%${search}%,job_title.ilike.%${search}%`)
      }

      // Apply pagination
      const from = (page - 1) * limit
      query = query.range(from, from + limit - 1)

      const { data: contracts, error: contractsError } = await query

      if (contractsError) {
        console.error("Error fetching contracts:", contractsError)
        await auditLogger.logSecurityEvent({
          event: 'data_access_error',
          userId: user?.id,
          path: '/api/contracts',
          error: contractsError.message,
          timestamp: new Date().toISOString(),
          severity: 'medium'
        })

        return NextResponse.json({
          success: false,
          error: "Failed to fetch contracts",
          details: process.env.NODE_ENV === 'development' ? contractsError.message : 'Database error'
        }, { status: 500 })
      }

      // Decrypt sensitive fields if user has proper permissions
      let processedContracts = contracts || []
      
      // Only decrypt for admin users or contract owners
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

      if (userProfile?.role === 'admin') {
        processedContracts = await Promise.all(
          contracts?.map(contract => 
            databaseSecurity.decryptSensitiveFields(contract, SENSITIVE_FIELDS.contracts)
          ) || []
        )
      }

      // Get total count for pagination
      const { count: totalContracts } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true })

      // Get statistics
      const stats = await getContractStats(supabase)

      return NextResponse.json({
        success: true,
        data: {
          contracts: processedContracts,
          pagination: {
            page,
            limit,
            total: totalContracts || 0,
            pages: Math.ceil((totalContracts || 0) / limit)
          },
          stats
        },
        meta: {
          timestamp: new Date().toISOString(),
          count: processedContracts.length
        }
      })

    } catch (error) {
      console.error("Unexpected error in contracts API:", error)
      
      await auditLogger.logSecurityEvent({
        event: 'api_unexpected_error',
        path: '/api/contracts',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        severity: 'high'
      })

      return NextResponse.json({
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: ['admin', 'user', 'promoter'],
    rateLimit: rateLimitPresets.api,
    logRequests: true,
    sanitizeInput: false // GET requests don't need input sanitization
  }
)

// Secured POST endpoint - Create new contract
export const POST = withSecurity(
  async (request: NextRequest) => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const body = await request.json()

      // Comprehensive input validation
      const requiredFields = ['first_party_id', 'second_party_id', 'promoter_id', 'job_title']
      const missingFields = requiredFields.filter(field => !body[field])

      if (missingFields.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Missing required fields',
          details: `Required fields: ${missingFields.join(', ')}`
        }, { status: 400 })
      }

      // Validate individual fields
      const validations = {
        job_title: validateInput(body.job_title, { ...VALIDATION_PRESETS.name, maxLength: 200 }),
        work_location: validateInput(body.work_location, { type: 'string', maxLength: 200, noHTML: true }),
        contract_value: validateInput(body.contract_value, { type: 'number', min: 0 })
      }

      const validationErrors = Object.entries(validations)
        .filter(([_, validation]) => !validation.isValid)
        .map(([field, validation]) => `${field}: ${validation.errors.join(', ')}`)

      if (validationErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: validationErrors
        }, { status: 400 })
      }

      // Generate secure contract number
      const contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Prepare contract data
      const contractData = {
        ...body,
        contract_number: contractNumber,
        status: 'pending',
        created_by: user?.id
      }

      // Use secure insert with encryption for sensitive fields
      const newContract = await databaseSecurity.secureInsert(
        'contracts',
        contractData,
        SENSITIVE_FIELDS.contracts,
        user?.id
      )

      // Log the creation
      await auditLogger.logContractAction('created', user?.id || '', newContract.id, null, contractData)

      return NextResponse.json({
        success: true,
        data: newContract,
        message: 'Contract created successfully'
      }, { status: 201 })

    } catch (error) {
      console.error("Error creating contract:", error)
      
      await auditLogger.logSecurityEvent({
        event: 'contract_creation_error',
        path: '/api/contracts',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        severity: 'medium'
      })

      return NextResponse.json({
        success: false,
        error: "Failed to create contract",
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: ['admin', 'user'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10 // Lower limit for creation
    },
    logRequests: true,
    sanitizeInput: true
  }
)

// Helper function to get contract statistics
async function getContractStats(supabase: any) {
  try {
    const [
      { count: totalContracts },
      { count: activeContracts },
      { count: pendingContracts },
      { count: completedContracts }
    ] = await Promise.all([
      supabase.from("contracts").select("*", { count: "exact", head: true }),
      supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "completed")
    ])

    return {
      total: totalContracts || 0,
      active: activeContracts || 0,
      pending: pendingContracts || 0,
      completed: completedContracts || 0
    }
  } catch (error) {
    console.error("Error fetching contract stats:", error)
    return {
      total: 0,
      active: 0,
      pending: 0,
      completed: 0
    }
  }
}
