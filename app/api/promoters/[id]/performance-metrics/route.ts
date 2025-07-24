import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterPerformanceMetric } from '@/lib/types'

const performanceMetricSchema = z.object({
  metric_type: z.string(),
  value: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  target_value: z.number().optional(),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { searchParams } = new URL(req.url)
  const metric_type = searchParams.get('metric_type')
  const start_date = searchParams.get('start_date')
  const end_date = searchParams.get('end_date')
  
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_performance_metrics')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('created_at', { ascending: false })
  
  if (metric_type) {
    query = query.eq('metric_type', metric_type)
  }
  if (start_date) {
    query = query.gte('period_start', start_date)
  }
  if (end_date) {
    query = query.lte('period_end', end_date)
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = performanceMetricSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  const { metric_type, value, period_start, period_end, target_value } = parsed.data
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_performance_metrics')
    .insert([{ 
      promoter_id, 
      metric_type, 
      value, 
      period_start, 
      period_end, 
      target_value 
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
  
  if (!id) return NextResponse.json({ error: 'Performance metric ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_performance_metrics')
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
  
  if (!id) return NextResponse.json({ error: 'Performance metric ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_performance_metrics')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 