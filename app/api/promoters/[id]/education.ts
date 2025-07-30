import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { z } from "zod"
import { PromoterEducation } from "@/lib/types"
import { NextRequest } from "next/server"

const educationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.number().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params

  // Placeholder response since promoter_education table doesn't exist yet
  return NextResponse.json([])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params
  const body = await req.json()
  const parsed = educationSchema.safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  // Placeholder response since promoter_education table doesn't exist yet
  return NextResponse.json({
    id: "placeholder",
    promoter_id,
    ...parsed.data,
    created_at: new Date().toISOString(),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params
  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) return NextResponse.json({ error: "Education ID required" }, { status: 400 })

  // Placeholder response since promoter_education table doesn't exist yet
  return NextResponse.json({
    id,
    promoter_id,
    ...updateData,
    updated_at: new Date().toISOString(),
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params
  const { id } = await req.json()

  if (!id) return NextResponse.json({ error: "Education ID required" }, { status: 400 })

  // Placeholder response since promoter_education table doesn't exist yet
  return NextResponse.json({ success: true })
}
