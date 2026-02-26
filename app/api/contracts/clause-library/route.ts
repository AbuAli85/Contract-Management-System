/**
 * Clause Library API
 * GET  /api/contracts/clause-library  — list/search clauses
 * POST /api/contracts/clause-library  — create a new clause
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';
import {
  listClauses,
  createClause,
  getClauseCategories,
  getClauseTags,
  type ClauseCategory,
} from '@/lib/services/clause-library-service';

export const GET = withRBAC('contracts:read:own', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action');

    if (action === 'categories') {
      const categories = await getClauseCategories();
      return NextResponse.json({ categories });
    }

    if (action === 'tags') {
      const tags = await getClauseTags();
      return NextResponse.json({ tags });
    }

    const result = await listClauses({
      query: searchParams.get('q') ?? undefined,
      category: (searchParams.get('category') as ClauseCategory) ?? undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      is_mandatory: searchParams.get('mandatory') === 'true' ? true : undefined,
      limit: parseInt(searchParams.get('limit') ?? '50'),
      offset: parseInt(searchParams.get('offset') ?? '0'),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch clauses' },
      { status: 500 }
    );
  }
});

export const POST = withRBAC('contracts:write:own', async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.title || !body.content || !body.category) {
      return NextResponse.json(
        { error: 'title, content, and category are required' },
        { status: 400 }
      );
    }

    const clause = await createClause({
      title: body.title,
      title_ar: body.title_ar,
      content: body.content,
      content_ar: body.content_ar,
      category: body.category,
      tags: body.tags ?? [],
      is_mandatory: body.is_mandatory ?? false,
    });

    return NextResponse.json({ clause }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create clause' },
      { status: 500 }
    );
  }
});
