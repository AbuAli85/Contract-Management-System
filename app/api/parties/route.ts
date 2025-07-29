import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Validation schema for party data
const partySchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_ar: z.string().min(1, 'Arabic name is required'),
  crn: z.string().min(1, 'CRN is required'),
  type: z.enum(['Employer', 'Client', 'Generic']).default('Generic'),
  role: z.string().optional(),
  cr_expiry_date: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address_en: z.string().optional(),
  address_ar: z.string().optional(),
  tax_number: z.string().optional(),
  license_number: z.string().optional(),
  license_expiry_date: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, ...options }) => {
                cookieStore.set(name, value, options as { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' })
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch parties from the database with related data
    const { data: parties, error } = await supabase
      .from('parties')
      .select(`
        *,
        contracts_as_first_party:contracts!contracts_first_party_id_fkey(
          id,
          contract_number,
          status,
          contract_start_date,
          contract_end_date
        ),
        contracts_as_second_party:contracts!contracts_second_party_id_fkey(
          id,
          contract_number,
          status,
          contract_start_date,
          contract_end_date
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching parties:', error)
      return NextResponse.json({ error: 'Failed to fetch parties' }, { status: 500 })
    }

    // Transform data to include contract counts
    const partiesWithCounts = parties?.map(party => ({
      ...party,
      total_contracts: (party.contracts_as_first_party?.length || 0) + (party.contracts_as_second_party?.length || 0),
      active_contracts: [
        ...(party.contracts_as_first_party?.filter((c: any) => c.status === 'active') || []),
        ...(party.contracts_as_second_party?.filter((c: any) => c.status === 'active') || [])
      ].length
    }))

    return NextResponse.json({ 
      success: true,
      parties: partiesWithCounts || [] 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, ...options }) => {
                cookieStore.set(name, value, options as { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' })
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = partySchema.parse(body)

    // Add owner_id field
    const partyData = {
      ...validatedData,
      owner_id: session.user.id
    }

    // Insert party into database
    const { data: party, error } = await supabase
      .from('parties')
      .insert([partyData])
      .select()
      .single()

    if (error) {
      console.error('Error creating party:', error)
      return NextResponse.json({ 
        error: 'Failed to create party',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      party 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.issues 
      }, { status: 400 })
    }
    
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 