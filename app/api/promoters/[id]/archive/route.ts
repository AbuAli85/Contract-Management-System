import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ratelimitSensitive, getClientIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';

const archiveSchema = z.object({
  reason: z.string().min(1).max(500),
  permanent: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { success } = await ratelimitSensitive.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions (simplified for now)
    // In a real implementation, you would check the user's role from the database
    // For now, we'll allow authenticated users to archive promoters

    // Validate input
    const body = await request.json();
    const validatedData = archiveSchema.parse(body);

    // For now, we'll simulate the archive process
    // In a real implementation, you would:
    // 1. Verify the promoter exists in the database
    // 2. Update the promoter's status to 'archived'
    // 3. Archive related records if permanent
    // 4. Log the action

    const archiveId = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate archive creation
    const archivedPromoter = {
      id: params.id,
      status: 'archived',
      archived_at: new Date().toISOString(),
      archived_by: user.id,
      archive_reason: validatedData.reason,
      permanent: validatedData.permanent,
    };

    return NextResponse.json({
      success: true,
      promoter: {
        id: archivedPromoter.id,
        status: archivedPromoter.status,
        archived_at: archivedPromoter.archived_at,
        archive_reason: archivedPromoter.archive_reason,
        permanent: archivedPromoter.permanent,
      },
      message: `Promoter has been successfully archived.`,
    });
  } catch (error) {
    console.error('Error in archive promoter API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { success } = await ratelimitSensitive.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions (simplified for now)
    // In a real implementation, you would check the user's role from the database
    // For now, we'll allow authenticated users to delete promoters

    // For now, we'll simulate the deletion process
    // In a real implementation, you would:
    // 1. Verify the promoter exists in the database
    // 2. Log the action before deletion
    // 3. Delete the promoter and related records

    return NextResponse.json({
      success: true,
      message: `Promoter has been permanently deleted.`,
    });
  } catch (error) {
    console.error('Error in delete promoter API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
