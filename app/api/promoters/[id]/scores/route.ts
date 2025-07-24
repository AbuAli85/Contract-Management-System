import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterScore } from '@/lib/types'

const scoreSchema = z.object({
  score_type: z.string(),
  score_value: z.number().min(0).max(100),
  max_score: z.number().min(0).max(1000).optional(),
  period_start: z.string(),
  period_end: z.string(),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { searchParams } = new URL(req.url)
  const score_type = searchParams.get('score_type')
  const period_start = searchParams.get('period_start')
  const period_end = searchParams.get('period_end')
  
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_scores')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('created_at', { ascending: false })
  
  if (score_type) {
    query = query.eq('score_type', score_type)
  }
  if (period_start) {
    query = query.gte('period_start', period_start)
  }
  if (period_end) {
    query = query.lte('period_end', period_end)
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = scoreSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  const { score_type, score_value, max_score, period_start, period_end } = parsed.data
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_scores')
    .insert([{ 
      promoter_id, 
      score_type, 
      score_value, 
      max_score: max_score || 100,
      period_start, 
      period_end 
    }])
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const { id, ...updateData } = body
  
  if (!id) return NextResponse.json({ error: 'Score ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_scores')
    .update(updateData)
    .eq('id', id)
    .eq('promoter_id', promoter_id)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req, { params }) {
  const { id: promoter_id } = params
  const { id } = await req.json()
  
  if (!id) return NextResponse.json({ error: 'Score ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_scores')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 