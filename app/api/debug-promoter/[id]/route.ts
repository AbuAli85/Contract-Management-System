import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch promoter data
    const { data: promoter, error } = await supabase
      .from('promoters')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch promoter',
        details: error.message 
      }, { status: 500 })
    }

    if (!promoter) {
      return NextResponse.json({ 
        error: 'Promoter not found',
        promoterId: id 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      promoter,
      debug: {
        hasNameEn: !!promoter.name_en,
        hasNameAr: !!promoter.name_ar,
        nameEnLength: promoter.name_en?.length || 0,
        nameArLength: promoter.name_ar?.length || 0,
        promoterId: id
      }
    })
  } catch (error) {
    console.error('Debug promoter API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
} 