import { NextResponse } from 'next/server';

export async function GET() {
  // Return a proper response for Vercel JWE requests
  return NextResponse.json(
    {
      error: 'not_found',
      message: 'JWE endpoint not configured for this deployment',
    },
    { status: 404 }
  );
}
