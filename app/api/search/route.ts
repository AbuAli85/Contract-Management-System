import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// ✅ SECURITY: RBAC enabled with rate limiting
export const GET = withRBAC('contract:read:own', async (request: NextRequest) => {
  try {
    console.log('🔍 Search API: Starting request');

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, contracts, promoters, parties
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        total: 0,
        query: query || '',
        message: 'Query too short. Please enter at least 2 characters.',
      });
    }

    const supabase = await createClient();
    const searchTerm = query.trim();

    // Get authenticated user for scoping
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role for scoping
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = (userProfile as any)?.role === 'admin';

    const results: any[] = [];

    // Search contracts
    if (type === 'all' || type === 'contracts') {
      try {
        let contractsQuery = supabase
          .from('contracts')
          .select(`
            id,
            contract_id,
            title,
            status,
            contract_start_date,
            contract_end_date,
            contract_value,
            first_party_id,
            second_party_id,
            created_at
          `)
          .or(`title.ilike.%${searchTerm}%,contract_id.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(limit);

        // Non-admin users only see their contracts
        if (!isAdmin) {
          contractsQuery = contractsQuery.or(
            `first_party_id.eq.${user.id},second_party_id.eq.${user.id}`
          );
        }

        const { data: contracts, error: contractsError } = await contractsQuery;

        if (!contractsError && contracts) {
          results.push(
            ...contracts.map(contract => ({
              type: 'contract',
              id: contract.id,
              title: contract.title || contract.contract_id,
              subtitle: `Status: ${contract.status} | Value: ${contract.contract_value || 'N/A'}`,
              url: `/en/contracts/${contract.id}`,
              created_at: contract.created_at,
            }))
          );
        }
      } catch (error) {
        console.warn('Search contracts error:', error);
      }
    }

    // Search promoters
    if (type === 'all' || type === 'promoters') {
      try {
        const { data: promoters, error: promotersError } = await supabase
          .from('promoters')
          .select(`
            id,
            name_en,
            name_ar,
            email,
            phone,
            status,
            created_at
          `)
          .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!promotersError && promoters) {
          results.push(
            ...promoters.map(promoter => ({
              type: 'promoter',
              id: promoter.id,
              title: promoter.name_en || promoter.name_ar,
              subtitle: `${promoter.email} | ${promoter.phone || 'No phone'}`,
              url: `/en/promoters/${promoter.id}`,
              created_at: promoter.created_at,
            }))
          );
        }
      } catch (error) {
        console.warn('Search promoters error:', error);
      }
    }

    // Search parties
    if (type === 'all' || type === 'parties') {
      try {
        const { data: parties, error: partiesError } = await supabase
          .from('parties')
          .select(`
            id,
            name_en,
            name_ar,
            crn,
            type,
            status,
            contact_person,
            contact_email,
            created_at
          `)
          .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,crn.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!partiesError && parties) {
          results.push(
            ...parties.map(party => ({
              type: 'party',
              id: party.id,
              title: party.name_en || party.name_ar,
              subtitle: `${party.type} | ${party.contact_email || 'No email'}`,
              url: `/en/parties/${party.id}`,
              created_at: party.created_at,
            }))
          );
        }
      } catch (error) {
        console.warn('Search parties error:', error);
      }
    }

    // Sort results by relevance and date
    results.sort((a, b) => {
      // Prioritize exact matches in title
      const aExact = a.title.toLowerCase().includes(searchTerm.toLowerCase());
      const bExact = b.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by creation date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Limit total results
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      results: limitedResults,
      total: limitedResults.length,
      query: searchTerm,
      searchType: type,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Search API: Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
});
