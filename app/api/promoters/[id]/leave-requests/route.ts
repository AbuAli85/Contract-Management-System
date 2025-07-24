import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterLeaveRequest } from '@/lib/types'

const leaveRequestSchema = z.object({
  leave_type: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional(),
  status: z.string().default('pending'),
})

export async function GET(req, { params }) {
  const { id: promoter_id } = params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_leave_requests')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }) {
  const { id: promoter_id } = params
  const body = await req.json()
  const parsed = leaveRequestSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  const { leave_type, start_date, end_date, reason, status } = parsed.data
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_leave_requests')
    .insert([{ 
      promoter_id, 
      leave_type, 
      start_date, 
      end_date, 
      reason, 
      status 
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
  
  if (!id) return NextResponse.json({ error: 'Leave request ID required' }, { status: 400 })
  
  // If status is being updated to approved/rejected, add approval info
  if (updateData.status === 'approved' || updateData.status === 'rejected') {
    updateData.approved_at = new Date().toISOString()
    // Note: approved_by should be set from the authenticated user
  }
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_leave_requests')
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
  
  if (!id) return NextResponse.json({ error: 'Leave request ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_leave_requests')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 