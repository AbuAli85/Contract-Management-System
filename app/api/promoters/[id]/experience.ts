import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterExperience } from '@/lib/types'

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { data, error } = await supabase
    .from('promoter_experience')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = experienceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { company, role, start_date, end_date, description } = parsed.data
  const { data, error } = await supabase
    .from('promoter_experience')
    .insert([{ promoter_id, company, role, start_date, end_date, description }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const { id, ...updateData } = body
  if (!id) return NextResponse.json({ error: 'Experience ID required' }, { status: 400 })
  const { data, error } = await supabase
    .from('promoter_experience')
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
  if (!id) return NextResponse.json({ error: 'Experience ID required' }, { status: 400 })
  const { error } = await supabase
    .from('promoter_experience')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 