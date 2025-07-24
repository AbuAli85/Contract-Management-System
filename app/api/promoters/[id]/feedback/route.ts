import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterFeedback } from '@/lib/types'

const feedbackSchema = z.object({
  feedback_type: z.string(),
  rating: z.number().min(1).max(5).optional(),
  feedback_text: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  areas_for_improvement: z.array(z.string()).optional(),
  is_anonymous: z.boolean().default(false),
})

export async function GET(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const { searchParams } = new URL(req.url)
  const feedback_type = searchParams.get('feedback_type')
  const rating = searchParams.get('rating')
  
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_feedback')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('created_at', { ascending: false })
  
  if (feedback_type) {
    query = query.eq('feedback_type', feedback_type)
  }
  if (rating) {
    query = query.eq('rating', parseInt(rating))
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id  } = await params;const body = await req.json()
  const parsed = feedbackSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  const { feedback_type, rating, feedback_text, strengths, areas_for_improvement, is_anonymous } = parsed.data
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_feedback')
    .insert([{ 
      promoter_id, 
      feedback_type, 
      rating, 
      feedback_text, 
      strengths, 
      areas_for_improvement, 
      is_anonymous 
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
  
  if (!id) return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_feedback')
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
  
  if (!id) return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_feedback')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 