import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterBadge } from '@/lib/types'

const badgeSchema = z.object({
  badge_type: z.string(),
  badge_name: z.string(),
  badge_description: z.string().optional(),
  badge_icon: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function GET(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const { searchParams } = new URL(req.url)
  const badge_type = searchParams.get('badge_type')
  const is_active = searchParams.get('is_active')
  
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_badges')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('earned_at', { ascending: false })
  
  if (badge_type) {
    query = query.eq('badge_type', badge_type)
  }
  if (is_active !== null) {
    query = query.eq('is_active', is_active === 'true')
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id  } = await params;const body = await req.json()
  const parsed = badgeSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  const { badge_type, badge_name, badge_description, badge_icon, is_active } = parsed.data
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_badges')
    .insert([{ 
      promoter_id, 
      badge_type, 
      badge_name, 
      badge_description, 
      badge_icon, 
      is_active 
    }])
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const body = await req.json()
  const { id, ...updateData } = body
  
  if (!id) return NextResponse.json({ error: 'Badge ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_badges')
    .update(updateData)
    .eq('id', id)
    .eq('promoter_id', promoter_id)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id  } = await params;const { id } = await req.json()
  
  if (!id) return NextResponse.json({ error: 'Badge ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_badges')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 