import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterNote } from '@/lib/types'

const noteSchema = z.object({
  content: z.string(),
  note_time: z.string().optional(),
  author: z.string().optional(),
  related_communication: z.string().optional(),
  related_task: z.string().optional(),
  visibility: z.string().optional(),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { searchParams } = new URL(req.url)
  const visibility = searchParams.get('visibility')
  const author = searchParams.get('author')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_notes')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('note_time', { ascending: false })

  if (visibility) query = query.eq('visibility', visibility)
  if (author) query = query.eq('author', author)
  if (start) query = query.gte('note_time', start)
  if (end) query = query.lte('note_time', end)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = noteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_notes')
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
  if (!id) return NextResponse.json({ error: 'Note ID required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_notes')
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
  if (!id) return NextResponse.json({ error: 'Note ID required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_notes')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 