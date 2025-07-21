import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type { User } from '@supabase/supabase-js'
import { format } from 'date-fns'

export async function GET() {
  try {
    const headersList = await headers()
    
    // Debug: Check cookies being sent
    const cookieHeader = headersList.get('cookie')
    console.log('🔍 API Debug - Cookie header:', cookieHeader ? 'present' : 'missing')
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const supabaseCookies = cookies.filter(c => c.startsWith('sb-'))
      console.log('🔍 API Debug - All cookies:', cookies)
      console.log('🔍 API Debug - Supabase cookies:', supabaseCookies)
      
      // Check for specific Supabase session cookies
      const sessionCookie = cookies.find(c => c.startsWith('sb-') && c.includes('auth-token'))
      if (sessionCookie) {
        console.log('🔍 API Debug - Found session cookie:', sessionCookie.substring(0, 50) + '...')
      } else {
        console.log('🔍 API Debug - No session cookie found')
      }
    }
    
    let user: User | undefined = undefined
    
    // Use Supabase's built-in session management
    const supabase = await createClient()

    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('🔍 API Debug - Session error:', sessionError)
    }
    
    console.log('🔍 API Debug - Session found:', !!session)
    if (session) {
      console.log('🔍 API Debug - User email:', session.user.email)
      user = session.user
    }
    
    // If no session, try to get user directly
    if (!user) {
      console.log('🔍 API Debug - No session, trying getUser()')
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('🔍 API Debug - Auth error:', userError)
        console.log('🔍 API Debug - No valid session found')
        return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
      } else {
        user = userData || undefined
        console.log('🔍 API Debug - User from getUser():', user ? user.email : 'null')
      }
    }
    
    if (!user) {
      console.log('🔍 API Debug - No user found in session or auth')
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    console.log('🔍 API Debug - User authenticated:', user.email)

    // Fetch contracts from the database
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('🔍 API Debug - Error fetching contracts:', error)
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
    }

    console.log(`🔍 API Debug - Fetched ${contracts?.length || 0} contracts`)
    return NextResponse.json(contracts || [])
  } catch (error) {
    console.error('🔍 API Debug - API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 API Debug - POST /api/contracts called')
    
    // Get the request body
    const body = await request.json()
    console.log('🔍 API Debug - Request body:', body)
    
    // Use Supabase's built-in session management
    const supabase = await createClient()

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('🔍 API Debug - Session error:', sessionError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }
    
    if (!session?.user) {
      console.log('🔍 API Debug - No user session found')
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    console.log('🔍 API Debug - User authenticated:', session.user.email)

    // Format dates properly for database storage
    const formatDate = (date: Date | string) => {
      if (typeof date === 'string') {
        return date
      }
      return format(date, 'yyyy-MM-dd')
    }

    // Prepare contract data
    const contractData = {
      first_party_id: body.first_party_id,
      second_party_id: body.second_party_id,
      promoter_id: body.promoter_id,
      contract_start_date: body.contract_start_date ? formatDate(body.contract_start_date) : null,
      contract_end_date: body.contract_end_date ? formatDate(body.contract_end_date) : null,
      email: body.email,
      job_title: body.job_title,
      work_location: body.work_location,
      department: body.department,
      contract_type: body.contract_type,
      currency: body.currency,
      user_id: session.user.id,
      status: 'draft'
    }

    console.log('🔍 API Debug - Contract data to insert:', contractData)

    // Insert the contract into the database
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single()

    if (error) {
      console.error('🔍 API Debug - Error creating contract:', error)
      return NextResponse.json({ 
        error: 'Failed to create contract',
        details: error.message 
      }, { status: 500 })
    }

    console.log('🔍 API Debug - Contract created successfully:', contract.id)
    return NextResponse.json({ contract })
  } catch (error) {
    console.error('🔍 API Debug - POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
