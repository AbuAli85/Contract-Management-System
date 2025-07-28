import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterCommunication } from '@/lib/types'
import { NextRequest } from 'next/server'

const communicationSchema = z.object({
  type: z.string(),
  subject: z.string().optional(),
  description: z.string().optional(),
  communication_time: z.string(),
  participants: z.array(z.any()).optional(),
  outcome: z.string().optional(),
  status: z.string().default('pending'),
  attachments: z.array(z.object({
    file_url: z.string(),
    file_name: z.string()
  })).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const body = await req.json()
  const parsed = communicationSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  // Placeholder response since promoter_communications table doesn't exist yet
  return NextResponse.json({ 
    id: 'placeholder',
    promoter_id,
    ...parsed.data,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const body = await req.json()
  const { id, ...updateData } = body
  
  if (!id) return NextResponse.json({ error: 'Communication ID required' }, { status: 400 })
  
  // Placeholder response since promoter_communications table doesn't exist yet
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
  
  if (!id) return NextResponse.json({ error: 'Communication ID required' }, { status: 400 })
  
  // Placeholder response since promoter_communications table doesn't exist yet
  return NextResponse.json({ success: true })
} 