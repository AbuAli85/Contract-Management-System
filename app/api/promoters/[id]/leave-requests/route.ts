import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterLeaveRequest } from '@/lib/types'
import { NextRequest } from 'next/server'

const leaveRequestSchema = z.object({
  leave_type: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional(),
  status: z.string().default('pending'),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  
  // Placeholder response since promoter_leave_requests table doesn't exist yet
  return NextResponse.json([])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const body = await req.json()
  const parsed = leaveRequestSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  // Placeholder response since promoter_leave_requests table doesn't exist yet
  return NextResponse.json({ 
    id: 'placeholder',
    promoter_id,
    ...parsed.data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const body = await req.json()
  const { id, ...updateData } = body
  
  if (!id) return NextResponse.json({ error: 'Leave request ID required' }, { status: 400 })
  
  // Placeholder response since promoter_leave_requests table doesn't exist yet
  return NextResponse.json({ 
    id,
    promoter_id,
    ...updateData,
    updated_at: new Date().toISOString()
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const { id } = await req.json()
  
  if (!id) return NextResponse.json({ error: 'Leave request ID required' }, { status: 400 })
  
  // Placeholder response since promoter_leave_requests table doesn't exist yet
  return NextResponse.json({ success: true })
} 