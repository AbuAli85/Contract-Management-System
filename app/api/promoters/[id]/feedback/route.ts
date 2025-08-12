import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { PromoterFeedback } from '@/lib/types';
import { NextRequest } from 'next/server';

const feedbackSchema = z.object({
  feedback_type: z.string(),
  rating: z.number().optional(),
  feedback_text: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  areas_for_improvement: z.array(z.string()).optional(),
  is_anonymous: z.boolean().default(false),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const { searchParams } = new URL(req.url);
  const feedback_type = searchParams.get('feedback_type');

  // Placeholder response since promoter_feedback table doesn't exist yet
  return NextResponse.json([]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promoter_id } = await params;
  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success)
    return NextResponse.json({ error: parsed.error }, { status: 400 });

  // Placeholder response since promoter_feedback table doesn't exist yet
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
    return NextResponse.json(
      { error: 'Feedback ID required' },
      { status: 400 }
    );

  // Placeholder response since promoter_feedback table doesn't exist yet
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
    return NextResponse.json(
      { error: 'Feedback ID required' },
      { status: 400 }
    );

  // Placeholder response since promoter_feedback table doesn't exist yet
  return NextResponse.json({ success: true });
}
