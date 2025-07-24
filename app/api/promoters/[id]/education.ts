import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterEducation } from '@/lib/types'

const educationSchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  year: z.number().optional(),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { data, error } = await supabase
    .from('promoter_education')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('year', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = educationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { degree, institution, year } = parsed.data
  const { data, error } = await supabase
    .from('promoter_education')
    .insert([{ promoter_id, degree, institution, year }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const { id, ...updateData } = body
  if (!id) return NextResponse.json({ error: 'Education ID required' }, { status: 400 })
  const { data, error } = await supabase
    .from('promoter_education')
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
  if (!id) return NextResponse.json({ error: 'Education ID required' }, { status: 400 })
  const { error } = await supabase
    .from('promoter_education')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 