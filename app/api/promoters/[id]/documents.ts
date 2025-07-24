import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterDocument } from '@/lib/types'

const documentSchema = z.object({
  type: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  version: z.number().optional(),
})

export async function GET(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const { data, error } = await supabase
    .from('promoter_documents')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('uploaded_on', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id  } = await params;const body = await req.json()
  const parsed = documentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { type, url, description, version } = parsed.data
  const { data, error } = await supabase
    .from('promoter_documents')
    .insert([{ promoter_id, type, url, description, version }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const body = await req.json()
  const { id, ...updateData } = body
  if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  const { data, error } = await supabase
    .from('promoter_documents')
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
  if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  const { error } = await supabase
    .from('promoter_documents')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 