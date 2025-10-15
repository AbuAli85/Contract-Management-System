import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import type { PromoterScore } from '@/lib/types';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * ⚠️ WARNING: PLACEHOLDER IMPLEMENTATION
 * 
 * This endpoint currently returns EMPTY ARRAYS and PLACEHOLDER DATA because
 * the `promoter_scores` table does not exist in the database schema.
 * 
 * TODO before production:
 * 1. Create `promoter_scores` table in Supabase with proper schema
 * 2. Add RLS policies for score data access
 * 3. Replace placeholder responses with real Supabase operations
 * 4. Add RBAC guards using withRBAC() for all endpoints
 * 5. Implement score calculation logic based on business rules
 * 6. Add audit logging for score updates
 * 
 * Performance tracking and scoring features WILL NOT WORK until this is implemented.
 */

const scoreSchema = z.object({
  score_type: z.string(),
  score_value: z.number(),
  max_score: z.number().optional(),
  period_start: z.string(),
  period_end: z.string(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const { searchParams } = new URL(req.url);
  const score_type = searchParams.get('score_type');
  // Placeholder response since promoter_scores table doesn't exist yet
  return NextResponse.json([]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const body = await req.json();
  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  // Placeholder response since promoter_scores table doesn't exist yet
  return NextResponse.json({
    id: 'placeholder',
    promoter_id,
    ...parsed.data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const body = await req.json();
  const { id, ...updateData } = body;
  if (!id)
    return NextResponse.json({ error: 'Score ID required' }, { status: 400 });
  // Placeholder response since promoter_scores table doesn't exist yet
  return NextResponse.json({
    id,
    promoter_id,
    ...updateData,
    updated_at: new Date().toISOString(),
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const { id } = await req.json();
  if (!id)
    return NextResponse.json({ error: 'Score ID required' }, { status: 400 });
  // Placeholder response since promoter_scores table doesn't exist yet
  return NextResponse.json({ success: true });
}
