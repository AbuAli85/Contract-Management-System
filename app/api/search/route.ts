import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SearchResult {
  id: string;
  type: 'contract' | 'promoter' | 'party';
  title: string;
  subtitle: string;
  url: string;
  metadata?: Record<string, any>;
}

/**
 * GET /api/search
 * Global search across contracts, promoters, and parties
 * 
 * Query parameters:
 * - q: Search query (required, minimum 2 characters)
 * - limit: Maximum results per type (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        message: 'Query must be at least 2 characters',
      });
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ results: [] });
    }

    // Get user role for RBAC
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role || 'user';

    const searchTerm = `%${query}%`;
    const results: SearchResult[] = [];

    // Search Contracts
    let contractsQuery = supabase
      .from('contracts')
      .select('id, contract_number, party_name, status, contract_type')
      .or(`contract_number.ilike.${searchTerm},party_name.ilike.${searchTerm}`)
      .limit(limit);

    // Apply RBAC for contracts
    if (userRole !== 'admin') {
      contractsQuery = contractsQuery.or(
        `first_party_id.eq.${user.id},second_party_id.eq.${user.id},client_id.eq.${user.id},employer_id.eq.${user.id}`
      );
    }

    const { data: contracts } = await contractsQuery;

    if (contracts) {
      contracts.forEach((contract) => {
        results.push({
          id: contract.id,
          type: 'contract',
          title: contract.contract_number || 'Untitled Contract',
          subtitle: `${contract.party_name || 'No party'} • ${contract.status || 'Unknown status'}`,
          url: `/contracts/${contract.id}`,
          metadata: {
            status: contract.status,
            type: contract.contract_type,
          },
        });
      });
    }

    // Search Promoters (admin/manager only)
    if (['admin', 'super_admin', 'manager'].includes(userRole)) {
      const { data: promoters } = await supabase
        .from('promoters')
        .select('id, full_name_en, full_name_ar, status, phone_number')
        .or(
          `full_name_en.ilike.${searchTerm},full_name_ar.ilike.${searchTerm},phone_number.ilike.${searchTerm}`
        )
        .limit(limit);

      if (promoters) {
        promoters.forEach((promoter) => {
          results.push({
            id: promoter.id,
            type: 'promoter',
            title: promoter.full_name_en || promoter.full_name_ar || 'Unnamed',
            subtitle: `${promoter.phone_number || 'No phone'} • ${promoter.status || 'Unknown status'}`,
            url: `/promoters/${promoter.id}`,
            metadata: {
              status: promoter.status,
              nameAr: promoter.full_name_ar,
            },
          });
        });
      }
    }

    // Search Parties
    const { data: parties } = await supabase
      .from('parties')
      .select('id, name, party_type, contact_person, email')
      .or(`name.ilike.${searchTerm},contact_person.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(limit);

    if (parties) {
      parties.forEach((party) => {
        results.push({
          id: party.id,
          type: 'party',
          title: party.name || 'Unnamed Party',
          subtitle: `${party.party_type || 'Unknown type'} • ${party.contact_person || 'No contact'}`,
          url: `/parties/${party.id}`,
          metadata: {
            type: party.party_type,
            email: party.email,
          },
        });
      });
    }

    // Sort results by relevance (exact matches first)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase());
      const bExact = b.title.toLowerCase().includes(query.toLowerCase());

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then sort by type priority: contracts > promoters > parties
      const typePriority = { contract: 0, promoter: 1, party: 2 };
      return typePriority[a.type] - typePriority[b.type];
    });

    return NextResponse.json({
      results: sortedResults,
      count: sortedResults.length,
      query,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
