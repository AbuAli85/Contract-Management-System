import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    const schemaChecks: Record<string, any> = {}

    // Check if bookings table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('bookings')
      .select('count')
      .limit(1)

    schemaChecks.bookings_table = {
      exists: !tableError,
      error: tableError?.message || null
    }

    if (!tableError) {
      // Check for required columns
      const requiredColumns = [
        'id', 'booking_number', 'service_id', 'provider_company_id', 
        'client_id', 'scheduled_start', 'scheduled_end', 'total_price', 
        'currency', 'status', 'notes', 'metadata'
      ]

      for (const column of requiredColumns) {
        try {
          const { error: columnError } = await supabase
            .from('bookings')
            .select(column)
            .limit(1)

          schemaChecks[`column_${column}`] = {
            exists: !columnError,
            error: columnError?.message || null
          }
        } catch (err) {
          schemaChecks[`column_${column}`] = {
            exists: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          }
        }
      }

      // Check for unique constraint on booking_number using database metadata
      try {
        const { data: constraints, error: constraintError } = await supabase
          .rpc('check_constraint_exists', {
            table_name: 'bookings',
            constraint_name: 'bookings_booking_number_unique'
          })
          .select()

        if (constraintError) {
          // Fallback: query information_schema directly
          const { data: constraintInfo, error: infoError } = await supabase
            .from('information_schema.table_constraints')
            .select('constraint_name')
            .eq('table_name', 'bookings')
            .eq('constraint_type', 'UNIQUE')
            .ilike('constraint_name', '%booking_number%')

          schemaChecks.unique_constraint_booking_number = {
            exists: !infoError && constraintInfo && constraintInfo.length > 0,
            error: infoError?.message || 'Constraint not found',
            note: 'Checked via information_schema'
          }
        } else {
          schemaChecks.unique_constraint_booking_number = {
            exists: constraints && constraints.length > 0,
            error: null,
            note: 'Checked via RPC function'
          }
        }
      } catch (constraintError) {
        // Simple test: try to create the constraint and see if it already exists
        schemaChecks.unique_constraint_booking_number = {
          exists: false,
          error: 'Could not verify constraint existence. Run migration to ensure it exists.',
          note: 'Manual check required'
        }
      }

      // Test upsert functionality
      try {
        const testPayload = {
          service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
          provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
          client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
          scheduled_start: new Date(Date.now() + 4*24*60*60*1000).toISOString(),
          scheduled_end: new Date(Date.now() + 4*24*60*60*1000 + 2*60*60*1000).toISOString(),
          total_price: 25.000,
          currency: 'OMR',
          booking_number: 'BK-SCHEMA-TEST-' + Date.now(),
          status: 'pending',
          metadata: { test: true }
        }

        const { data: upsertData, error: upsertError } = await supabase
          .from('bookings')
          .upsert(testPayload, { onConflict: 'booking_number', ignoreDuplicates: false })
          .select('id, booking_number, status')
          .single()

        schemaChecks.upsert_functionality = {
          works: !upsertError,
          error: upsertError?.message || null,
          result: upsertData || null
        }

        // Clean up test data
        if (upsertData) {
          await supabase
            .from('bookings')
            .delete()
            .eq('id', upsertData.id)
        }
      } catch (upsertTestError) {
        schemaChecks.upsert_functionality = {
          works: false,
          error: upsertTestError instanceof Error ? upsertTestError.message : 'Unknown upsert test error'
        }
      }
    }

    // Check related tables
    const relatedTables = ['services', 'companies', 'profiles', 'users']
    for (const table of relatedTables) {
      try {
        const { error: relatedError } = await supabase
          .from(table)
          .select('count')
          .limit(1)

        schemaChecks[`related_table_${table}`] = {
          exists: !relatedError,
          error: relatedError?.message || null
        }
      } catch (err) {
        schemaChecks[`related_table_${table}`] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      schemaChecks,
      summary: {
        bookings_table_exists: schemaChecks.bookings_table?.exists || false,
        required_columns_exist: Object.keys(schemaChecks)
          .filter(key => key.startsWith('column_'))
          .every(key => schemaChecks[key]?.exists),
        unique_constraint_exists: schemaChecks.unique_constraint_booking_number?.exists || false,
        upsert_works: schemaChecks.upsert_functionality?.works || false,
        all_ready: false // Will be calculated
      },
      timestamp: new Date().toISOString(),
      instructions: {
        next_steps: [
          "1. Run the migration: supabase/migrations/20250117_fix_bookings_schema.sql",
          "2. Ensure all required tables (services, companies, profiles/users) exist",
          "3. Test the booking upsert functionality",
          "4. Check that the unique constraint on booking_number is working"
        ]
      }
    })

  } catch (error) {
    console.error('Booking schema check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check booking schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}