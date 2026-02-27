import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In this environment Stripe is not configured / SDK is not installed.
// Accept and ignore all webhook calls to avoid noisy failures in non-billing deployments.

export async function POST(_request: NextRequest) {
  return NextResponse.json({ received: true, mode: 'DISABLED' });
}

