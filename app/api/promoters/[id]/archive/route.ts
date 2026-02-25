import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ratelimitSensitive, getClientIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';

const archivePostSchema = z.object({
  reason: z.string().min(1).max(500).optional().default('Archived by admin'),
  permanent: z.boolean().default(false),
});

const archivePutSchema = z.object({
  archived: z.boolean(),
  reason: z.string().min(1).max(500).optional(),
});

async function getAuthenticatedUser(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const { success } = await ratelimitSensitive.limit(identifier);
  if (!success) {
    return {
      error: NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, supabase };
}

// POST: Full archive with reason (used by bulk operations and admin panel)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;

    const { id } = await params;

    // Validate input
    const body = await request.json();
    const validatedData = archivePostSchema.parse(body);

    // Verify promoter exists
    const { data: promoter, error: fetchError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, status')
      .eq('id', id)
      .single();

    if (fetchError || !promoter) {
      return NextResponse.json(
        { error: 'Promoter not found' },
        { status: 404 }
      );
    }

    // Update promoter status to archived
    const newStatus = validatedData.permanent ? 'terminated' : 'inactive';
    const { error: updateError } = await supabase
      .from('promoters')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to archive promoter', details: updateError.message },
        { status: 500 }
      );
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'archive_promoter',
        table_name: 'promoters',
        record_id: id,
        old_values: { status: promoter.status },
        new_values: {
          status: newStatus,
          reason: validatedData.reason,
          permanent: validatedData.permanent,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Audit log failure is non-critical
    }

    return NextResponse.json({
      success: true,
      promoter: {
        id,
        status: newStatus,
        archived_at: new Date().toISOString(),
        archive_reason: validatedData.reason,
        permanent: validatedData.permanent,
      },
      message: `Promoter has been successfully archived.`,
    });
  } catch (error) {
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

// PUT: Quick archive toggle (used by table row action menu)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;

    const { id } = await params;

    // Validate input
    const body = await request.json();
    const validatedData = archivePutSchema.parse(body);

    // Verify promoter exists
    const { data: promoter, error: fetchError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, status')
      .eq('id', id)
      .single();

    if (fetchError || !promoter) {
      return NextResponse.json(
        { error: 'Promoter not found' },
        { status: 404 }
      );
    }

    // Toggle archive status
    const newStatus = validatedData.archived ? 'inactive' : 'active';
    const { error: updateError } = await supabase
      .from('promoters')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        {
          error: validatedData.archived
            ? 'Failed to archive promoter'
            : 'Failed to restore promoter',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: validatedData.archived ? 'archive_promoter' : 'restore_promoter',
        table_name: 'promoters',
        record_id: id,
        old_values: { status: promoter.status },
        new_values: {
          status: newStatus,
          reason: validatedData.reason || 'Quick archive via table action',
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Audit log failure is non-critical
    }

    const displayName = promoter.name_en || promoter.name_ar || 'Promoter';
    return NextResponse.json({
      success: true,
      promoter: { id, status: newStatus },
      message: validatedData.archived
        ? `${displayName} has been archived.`
        : `${displayName} has been restored.`,
    });
  } catch (error) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;

    const { id } = await params;

    // Verify promoter exists
    const { data: promoter, error: fetchError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar')
      .eq('id', id)
      .single();

    if (fetchError || !promoter) {
      return NextResponse.json(
        { error: 'Promoter not found' },
        { status: 404 }
      );
    }

    // Log before deletion
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'delete_promoter',
        table_name: 'promoters',
        record_id: id,
        old_values: { name_en: promoter.name_en, name_ar: promoter.name_ar },
        new_values: null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Audit log failure is non-critical
    }

    // Delete the promoter
    const { error: deleteError } = await supabase
      .from('promoters')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete promoter', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Promoter has been permanently deleted.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
