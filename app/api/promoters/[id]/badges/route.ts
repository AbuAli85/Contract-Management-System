import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { z } from "zod"
import { PromoterBadge } from "@/lib/types"
import { NextRequest } from "next/server"

const badgeSchema = z.object({
  badge_type: z.string(),
  badge_name: z.string(),
  badge_description: z.string().optional(),
  badge_icon: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params
  const { searchParams } = new URL(req.url)
  const badge_type = searchParams.get("badge_type")
  const is_active = searchParams.get("is_active")

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("promoter_badges")
    .select("*")
    .eq("promoter_id", promoter_id)
    .order("earned_at", { ascending: false })

  if (badge_type) {
    query = query.eq("badge_type", badge_type)
  }
  if (is_active !== null) {
    query = query.eq("is_active", is_active === "true")
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params
  const body = await req.json()
  const parsed = badgeSchema.safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  // Placeholder response since promoter_badges table doesn't exist yet
  return NextResponse.json({
    id: "placeholder",
    promoter_id,
    ...parsed.data,
    earned_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id } = await params
  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) return NextResponse.json({ error: "Badge ID required" }, { status: 400 })

  // Placeholder response since promoter_badges table doesn't exist yet
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

  if (!id) return NextResponse.json({ error: "Badge ID required" }, { status: 400 })

  // Placeholder response since promoter_badges table doesn't exist yet
  return NextResponse.json({ success: true })
}
