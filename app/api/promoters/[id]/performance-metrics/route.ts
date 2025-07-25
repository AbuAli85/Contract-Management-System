import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { PromoterPerformanceMetric } from '@/lib/types'
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const metricSchema = z.object({
  metric_type: z.string(),
  value: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  target_value: z.number().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const { searchParams } = new URL(req.url)
  const metric_type = searchParams.get('metric_type')
  // Placeholder response since promoter_performance_metrics table doesn't exist yet
  return NextResponse.json([])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params;
  const body = await req.json()
  const parsed = metricSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  // Placeholder response since promoter_performance_metrics table doesn't exist yet
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
  if (!id) return NextResponse.json({ error: 'Metric ID required' }, { status: 400 })
  // Placeholder response since promoter_performance_metrics table doesn't exist yet
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
  if (!id) return NextResponse.json({ error: 'Metric ID required' }, { status: 400 })
  // Placeholder response since promoter_performance_metrics table doesn't exist yet
  return NextResponse.json({ success: true })
} 