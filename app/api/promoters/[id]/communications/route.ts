import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterCommunication } from '@/lib/types'

const communicationSchema = z.object({
  type: z.string(),
  subject: z.string().optional(),
  description: z.string().optional(),
  communication_time: z.string(),
  participants: z.array(z.any()).optional(),
  outcome: z.string().optional(),
  status: z.string().optional(),
  attachments: z.array(z.object({ file_url: z.string(), file_name: z.string() })).optional(),
  created_by: z.string().optional(),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_communications')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('communication_time', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (start) query = query.gte('communication_time', start)
  if (end) query = query.lte('communication_time', end)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = communicationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_communications')
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
  if (!id) return NextResponse.json({ error: 'Communication ID required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_communications')
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
  if (!id) return NextResponse.json({ error: 'Communication ID required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_communications')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 