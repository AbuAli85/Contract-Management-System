import { NextRequest, NextResponse } from 'next/server';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';

/**
 * Promoter score endpoints are disabled until the scoring schema exists.
 * Returning 501 keeps the UI honest and surfaces the missing migration work.
 */
const notImplemented = (action: string) =>
  NextResponse.json(
    {
      success: false,
      error: 'NOT_IMPLEMENTED',
      details:
        'Promoter score ' +
        action +
        ' is not available yet. Provision the promoter_scores table and update this handler before enabling.',
    },
    { status: 501 }
  );

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAnyRBAC(
  ['promoter:read:own', 'promoter:manage:own'],
  async (_req: NextRequest, _context: RouteContext) => notImplemented('retrieval')
);

export const POST = withRBAC(
  'promoter:manage:own',
  async (_req: NextRequest, _context: RouteContext) => notImplemented('creation')
);

export const PUT = withRBAC(
  'promoter:manage:own',
  async (_req: NextRequest, _context: RouteContext) => notImplemented('update')
);

export const DELETE = withRBAC(
  'promoter:manage:own',
  async (req: NextRequest, _context: RouteContext) => {
    const body = await req.json().catch(() => ({ id: undefined as string | undefined }));
    const { id } = body ?? {};

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          details: 'Score ID required for delete operation',
        },
        { status: 400 }
      );
    }

    return notImplemented('deletion');
  }
);

