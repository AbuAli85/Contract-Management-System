import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterAttendanceLog } from '@/lib/types'

const attendanceLogSchema = z.object({
  date: z.string(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  status: z.string().default('present'),
  notes: z.string().optional(),
})

export async function GET(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('promoter_attendance_logs')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('date', { ascending: false })
  
  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id  } = await params;const body = await req.json()
  const parsed = attendanceLogSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  const { date, check_in_time, check_out_time, status, notes } = parsed.data
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_attendance_logs')
    .insert([{ 
      promoter_id, 
      date, 
      check_in_time, 
      check_out_time, 
      status, 
      notes 
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
  
  if (!id) return NextResponse.json({ error: 'Attendance log ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('promoter_attendance_logs')
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
  
  if (!id) return NextResponse.json({ error: 'Attendance log ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('promoter_attendance_logs')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 