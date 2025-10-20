import { NextRequest, NextResponse } from 'next/server';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';

/**
 * Promoter reports API is intentionally disabled.
 * The underlying storage (promoter_reports table, templates, audit trail) is
 * not provisioned yet, so we surface an explicit 501 response instead of
 * returning placeholder data.
 *
 * TODO before enabling this endpoint:
 * 1. Add the required Supabase tables/migrations for promoter reports
 * 2. Configure RLS policies and RBAC mappings for report access
 * 3. Replace the notImplemented helper usage with real Supabase operations
 * 4. Add auditing/streaming support as needed by the product requirements
 */
const notImplemented = (action: string) =>
  NextResponse.json(
    {
      success: false,
      error: 'NOT_IMPLEMENTED',
      details:
        'Promoter reports ' +
        action +
        ' is not available yet. Provision the data layer and update this handler before enabling.',
    },
    { status: 501 }
  );

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAnyRBAC(
  ['promoter:read:own', 'promoter:manage:own'],
  async (_req: NextRequest, _context: RouteContext) =>
    notImplemented('retrieval')
);

export const POST = withRBAC(
  'promoter:manage:own',
  async (_req: NextRequest, _context: RouteContext) =>
    notImplemented('creation')
);

export const PUT = withRBAC(
  'promoter:manage:own',
  async (_req: NextRequest, _context: RouteContext) => notImplemented('update')
);

export const DELETE = withRBAC(
  'promoter:manage:own',
  async (req: NextRequest, _context: RouteContext) => {
    const body = await req
      .json()
      .catch(() => ({ id: undefined as string | undefined }));
    const { id } = body ?? {};

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          details: 'Report ID required for delete operation',
        },
        { status: 400 }
      );
    }

    return notImplemented('deletion');
  }
);
