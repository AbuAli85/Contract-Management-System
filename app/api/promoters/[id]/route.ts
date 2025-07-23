import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for promoter updates
const promoterUpdateSchema = z.object({
  name_en: z.string().min(1, 'English name is required').optional(),
  name_ar: z.string().min(1, 'Arabic name is required').optional(),
  id_card_number: z.string().min(1, 'ID card number is required').optional(),
  id_card_url: z.string().optional(),
  passport_url: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  nationality: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Fetch promoter with related data
    const { data: promoter, error } = await supabase
      .from('promoters')
      .select(`
        *,
        contracts:contracts!contracts_promoter_id_fkey(
          id,
          contract_number,
          status,
          contract_start_date,
          contract_end_date,
          job_title,
          work_location,
          first_party:parties!contracts_first_party_id_fkey(name_en, name_ar),
          second_party:parties!contracts_second_party_id_fkey(name_en, name_ar)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Promoter not found' }, { status: 404 })
      }
      console.error('Error fetching promoter:', error)
      return NextResponse.json({ error: 'Failed to fetch promoter' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      promoter 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const validatedData = promoterUpdateSchema.parse(body)

    // Update promoter in database
    const { data: promoter, error } = await supabase
      .from('promoters')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Promoter not found' }, { status: 404 })
      }
      console.error('Error updating promoter:', error)
      return NextResponse.json({ 
        error: 'Failed to update promoter',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      promoter 
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if promoter has active contracts
    const { data: activeContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id')
      .eq('promoter_id', id)
      .eq('status', 'active')

    if (contractsError) {
      console.error('Error checking contracts:', contractsError)
      return NextResponse.json({ error: 'Failed to check contracts' }, { status: 500 })
    }

    if (activeContracts && activeContracts.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete promoter with active contracts',
        activeContractsCount: activeContracts.length
      }, { status: 400 })
    }

    // Delete promoter
    const { error } = await supabase
      .from('promoters')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Promoter not found' }, { status: 404 })
      }
      console.error('Error deleting promoter:', error)
      return NextResponse.json({ 
        error: 'Failed to delete promoter',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Promoter deleted successfully' 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 