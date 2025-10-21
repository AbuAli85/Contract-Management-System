import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/promoters/[id]/skills
 * Fetch promoter skills (placeholder for future implementation)
 */
export const GET = withRBAC('promoter:read:own', async (request: Request, { params }: { params: { id: string } }) => {
  try {
    const promoterId = params.id;
    
    // TODO: Implement skills fetching from database
    // For now, return empty array to prevent 404 errors
    
    return NextResponse.json({
      success: true,
      skills: [],
      message: 'Skills feature coming soon'
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
});
