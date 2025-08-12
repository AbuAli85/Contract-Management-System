import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API route working without locale prefix',
    timestamp: new Date().toISOString(),
    path: '/api/test-i18n',
  });
}
