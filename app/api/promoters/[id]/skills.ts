import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterSkill } from '@/lib/types'

const skillSchema = z.object({
  skill: z.string().min(1),
  level: z.string().optional(),
})

export async function GET(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const { data, error } = await supabase
    .from('promoter_skills')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id  } = await params;const body = await req.json()
  const parsed = skillSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { skill, level } = parsed.data
  const { data, error } = await supabase
    .from('promoter_skills')
    .insert([{ promoter_id, skill, level }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const body = await req.json()
  const { id, ...updateData } = body
  if (!id) return NextResponse.json({ error: 'Skill ID required' }, { status: 400 })
  const { data, error } = await supabase
    .from('promoter_skills')
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
  if (!id) return NextResponse.json({ error: 'Skill ID required' }, { status: 400 })
  const { error } = await supabase
    .from('promoter_skills')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 