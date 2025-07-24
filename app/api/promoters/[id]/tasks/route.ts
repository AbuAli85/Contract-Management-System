import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterTask } from '@/lib/types'

const taskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().optional(),
  related_communication: z.string().optional(),
  created_by: z.string().optional(),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const due = searchParams.get('due')

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_tasks')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('due_date', { ascending: true })

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (due) query = query.lte('due_date', due)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = taskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_tasks')
    .insert([{ promoter_id, ...parsed.data }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const { id, ...updateData } = body
  if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_tasks')
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
  if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_tasks')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 