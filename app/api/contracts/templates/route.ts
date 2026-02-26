/**
 * Contract Templates API
 * GET  /api/contracts/templates  — list templates
 * POST /api/contracts/templates  — create a template
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

export const GET = withRBAC('contracts:read:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const contractType = searchParams.get('contract_type');
    const language = searchParams.get('language');

    let query = supabase
      .from('contract_templates')
      .select('id, name, name_ar, description, contract_type, language, is_active, is_default, version, created_at, updated_at')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (contractType) query = query.eq('contract_type', contractType);
    if (language) query = query.eq('language', language);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ templates: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
});

export const POST = withRBAC('contracts:write:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (!body.name || !body.contract_type) {
      return NextResponse.json(
        { error: 'name and contract_type are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('contract_templates')
      .insert({
        name: body.name,
        name_ar: body.name_ar,
        description: body.description,
        contract_type: body.contract_type,
        language: body.language ?? 'en',
        body_html: body.body_html ?? '',
        body_html_ar: body.body_html_ar,
        fields: body.fields ?? [],
        clause_ids: body.clause_ids ?? [],
        is_active: true,
        is_default: body.is_default ?? false,
        version: 1,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
});
