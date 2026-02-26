/**
 * Clause Library Service
 *
 * Manages a reusable library of contract clauses. Clauses can be:
 *   - Categorized (indemnity, liability, confidentiality, payment, etc.)
 *   - Tagged for fast search
 *   - Versioned (each edit creates a new version; old versions are retained)
 *   - Inserted directly into contract templates
 *
 * All operations are tenant-scoped via company_id.
 */

import { createClient } from '@/lib/supabase/server';

export type ClauseCategory =
  | 'indemnity'
  | 'liability'
  | 'confidentiality'
  | 'payment'
  | 'termination'
  | 'dispute_resolution'
  | 'intellectual_property'
  | 'force_majeure'
  | 'governing_law'
  | 'general'
  | 'custom';

export interface Clause {
  id: string;
  company_id: string;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  category: ClauseCategory;
  tags: string[];
  is_mandatory: boolean;
  is_active: boolean;
  version: number;
  parent_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClauseInput {
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  category: ClauseCategory;
  tags?: string[];
  is_mandatory?: boolean;
}

export interface UpdateClauseInput extends Partial<CreateClauseInput> {
  is_active?: boolean;
}

export interface ClauseSearchParams {
  query?: string;
  category?: ClauseCategory;
  tags?: string[];
  is_mandatory?: boolean;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface ClauseListResult {
  clauses: Clause[];
  total: number;
}

/**
 * List clauses for the current company with optional filtering.
 */
export async function listClauses(params: ClauseSearchParams = {}): Promise<ClauseListResult> {
  const supabase = await createClient();

  let query = supabase
    .from('clause_library')
    .select('*', { count: 'exact' })
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (params.category) query = query.eq('category', params.category);
  if (params.is_mandatory !== undefined) query = query.eq('is_mandatory', params.is_mandatory);
  if (params.is_active !== undefined) query = query.eq('is_active', params.is_active);
  else query = query.eq('is_active', true); // default: only active clauses

  if (params.query) {
    query = query.or(
      'title.ilike.%' + params.query + '%,content.ilike.%' + params.query + '%,title_ar.ilike.%' + params.query + '%'
    );
  }

  if (params.tags && params.tags.length > 0) {
    query = query.overlaps('tags', params.tags);
  }

  if (params.limit) query = query.limit(params.limit);
  if (params.offset) query = query.range(params.offset, (params.offset + (params.limit ?? 20)) - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { clauses: (data ?? []) as Clause[], total: count ?? 0 };
}

/**
 * Get a single clause by ID.
 */
export async function getClause(id: string): Promise<Clause | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clause_library')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Clause;
}

/**
 * Get all versions of a clause (by parent_id chain).
 */
export async function getClauseVersions(clauseId: string): Promise<Clause[]> {
  const supabase = await createClient();

  // Get the root clause first
  const root = await getClause(clauseId);
  if (!root) return [];

  const rootId = root.parent_id ?? root.id;

  const { data, error } = await supabase
    .from('clause_library')
    .select('*')
    .or('id.eq.' + rootId + ',parent_id.eq.' + rootId)
    .order('version', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Clause[];
}

/**
 * Create a new clause.
 */
export async function createClause(input: CreateClauseInput): Promise<Clause> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('clause_library')
    .insert({
      title: input.title,
      title_ar: input.title_ar,
      content: input.content,
      content_ar: input.content_ar,
      category: input.category,
      tags: input.tags ?? [],
      is_mandatory: input.is_mandatory ?? false,
      is_active: true,
      version: 1,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Clause;
}

/**
 * Update a clause. Creates a new version and deactivates the old one.
 */
export async function updateClause(id: string, input: UpdateClauseInput): Promise<Clause> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await getClause(id);
  if (!existing) throw new Error('Clause not found');

  // If content is changing, create a new version
  if (input.content !== undefined || input.content_ar !== undefined || input.title !== undefined) {
    // Deactivate old version
    await supabase.from('clause_library').update({ is_active: false }).eq('id', id);

    // Create new version
    const { data, error } = await supabase
      .from('clause_library')
      .insert({
        title: input.title ?? existing.title,
        title_ar: input.title_ar ?? existing.title_ar,
        content: input.content ?? existing.content,
        content_ar: input.content_ar ?? existing.content_ar,
        category: input.category ?? existing.category,
        tags: input.tags ?? existing.tags,
        is_mandatory: input.is_mandatory ?? existing.is_mandatory,
        is_active: true,
        version: existing.version + 1,
        parent_id: existing.parent_id ?? existing.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Clause;
  }

  // Otherwise, just update metadata (tags, is_active, is_mandatory)
  const { data, error } = await supabase
    .from('clause_library')
    .update({
      tags: input.tags ?? existing.tags,
      is_mandatory: input.is_mandatory ?? existing.is_mandatory,
      is_active: input.is_active ?? existing.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Clause;
}

/**
 * Soft-delete a clause (marks as inactive).
 */
export async function deleteClause(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('clause_library')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Get all available categories with clause counts.
 */
export async function getClauseCategories(): Promise<Array<{ category: ClauseCategory; count: number }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clause_library')
    .select('category')
    .eq('is_active', true);

  if (error) throw error;

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { category: string }) => {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  });

  return Object.entries(counts).map(([category, count]) => ({
    category: category as ClauseCategory,
    count,
  }));
}

/**
 * Get all unique tags used across clauses.
 */
export async function getClauseTags(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clause_library')
    .select('tags')
    .eq('is_active', true);

  if (error) throw error;

  const allTags = new Set<string>();
  (data ?? []).forEach((row: { tags: string[] }) => {
    (row.tags ?? []).forEach(tag => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Get mandatory clauses for a given contract type.
 */
export async function getMandatoryClauses(category?: ClauseCategory): Promise<Clause[]> {
  const supabase = await createClient();

  let query = supabase
    .from('clause_library')
    .select('*')
    .eq('is_mandatory', true)
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Clause[];
}
