import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for promoter data
const promoterSchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_ar: z.string().min(1, 'Arabic name is required'),
  id_card_number: z.string().min(1, 'ID card number is required'),
  id_card_url: z.string().optional(),
  passport_url: z.string().optional(),
  passport_number: z.string().optional(),
  mobile_number: z.string().optional(),
  profile_picture_url: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other']).default('active'),
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

    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
    }
    
    // If no session, try to get user directly
    let user = session?.user
    if (!user) {
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth error:', userError)
        return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
      }
      
      user = userData || undefined
    }
    
    if (!user) {
      console.log('No user found in session or auth')
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    console.log('User authenticated for promoters:', user.email)

    // Fetch promoters from the database with related data
    const { data: promoters, error } = await supabase
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
          work_location
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promoters:', error)
      return NextResponse.json({ error: 'Failed to fetch promoters' }, { status: 500 })
    }

    console.log(`Fetched ${promoters?.length || 0} promoters`)
    return NextResponse.json({ 
      success: true,
      promoters: promoters || [] 
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
    const validatedData = promoterSchema.parse(body)

    // Add created_by field
    const promoterData = {
      ...validatedData,
      created_by: session.user.id
    }

    // Insert promoter into database
    const { data: promoter, error } = await supabase
      .from('promoters')
      .insert([promoterData])
      .select()
      .single()

    if (error) {
      console.error('Error creating promoter:', error)
      return NextResponse.json({ 
        error: 'Failed to create promoter',
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
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 