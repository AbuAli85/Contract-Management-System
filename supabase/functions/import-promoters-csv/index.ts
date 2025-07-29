import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CSVPromoterData {
  firstName: string
  lastName: string
  email: string
  mobile_number: string
  nationality: string
  id_card_number: string
  passport_number?: string
  job_title?: string
  work_location?: string
  status: string
  notes?: string
}

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  total: number
}

// Validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+?[1-9]\d{1,14}|[0-9]{10,15})$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

function validateRequired(value: string): boolean {
  return value && value.trim().length > 0
}

function validateStatus(status: string): boolean {
  const validStatuses = [
    'active', 'inactive', 'suspended', 'holiday', 'on_leave', 
    'terminated', 'pending_approval', 'retired', 'probation', 
    'resigned', 'contractor', 'temporary', 'training', 'other'
  ]
  return validStatuses.includes(status.toLowerCase())
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const { csvData, userId } = await req.json()

    if (!csvData || !Array.isArray(csvData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSV data format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      total: csvData.length
    }

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      const rowNumber = i + 2 // +2 because CSV has header and we're 0-indexed

      try {
        // Validate required fields
        if (!validateRequired(row.firstName)) {
          result.errors.push(`Row ${rowNumber}: First name is required`)
          continue
        }

        if (!validateRequired(row.lastName)) {
          result.errors.push(`Row ${rowNumber}: Last name is required`)
          continue
        }

        if (!validateRequired(row.email)) {
          result.errors.push(`Row ${rowNumber}: Email is required`)
          continue
        }

        if (!validateEmail(row.email)) {
          result.errors.push(`Row ${rowNumber}: Invalid email format`)
          continue
        }

        if (!validateRequired(row.mobile_number)) {
          result.errors.push(`Row ${rowNumber}: Mobile number is required`)
          continue
        }

        if (!validatePhone(row.mobile_number)) {
          result.errors.push(`Row ${rowNumber}: Invalid phone number format`)
          continue
        }

        if (!validateRequired(row.nationality)) {
          result.errors.push(`Row ${rowNumber}: Nationality is required`)
          continue
        }

        if (!validateRequired(row.id_card_number)) {
          result.errors.push(`Row ${rowNumber}: ID card number is required`)
          continue
        }

        if (!validateRequired(row.status)) {
          result.errors.push(`Row ${rowNumber}: Status is required`)
          continue
        }

        if (!validateStatus(row.status)) {
          result.errors.push(`Row ${rowNumber}: Invalid status value`)
          continue
        }

        // Check if promoter already exists
        const { data: existingPromoter } = await supabase
          .from('promoters')
          .select('id')
          .eq('email', row.email.toLowerCase())
          .single()

        if (existingPromoter) {
          result.errors.push(`Row ${rowNumber}: Promoter with email ${row.email} already exists`)
          continue
        }

        // Prepare promoter data
        const promoterData = {
          name_en: `${row.firstName} ${row.lastName}`,
          name_ar: `${row.firstName} ${row.lastName}`, // You might want to add Arabic name field to CSV
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email.toLowerCase(),
          mobile_number: row.mobile_number.replace(/\s+/g, ''),
          nationality: row.nationality,
          id_card_number: row.id_card_number,
          passport_number: row.passport_number || null,
          job_title: row.job_title || null,
          work_location: row.work_location || null,
          status: row.status.toLowerCase(),
          notes: row.notes || null,
          created_at: new Date().toISOString()
        }

        // Insert promoter
        const { data: newPromoter, error: insertError } = await supabase
          .from('promoters')
          .insert(promoterData)
          .select()
          .single()

        if (insertError) {
          result.errors.push(`Row ${rowNumber}: Database error - ${insertError.message}`)
          continue
        }

        // Log the import activity
        await supabase
          .from('system_activity_log')
          .insert({
            action: 'promoter_imported',
            user_id: userId,
            details: {
              promoter_id: newPromoter.id,
              promoter_name: promoterData.name_en,
              source: 'csv_import'
            },
            created_at: new Date().toISOString()
          })

        result.imported++

      } catch (error) {
        result.errors.push(`Row ${rowNumber}: Unexpected error - ${error.message}`)
      }
    }

    result.success = result.imported > 0

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in import-promoters-csv:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})