import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user but don't fail if not authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.warn(
        'Activities API: User error (continuing anyway):',
        userError
      );
    }
    if (!user) {
      console.warn('Activities API: No user found (continuing anyway)');
    }

    // Get recent activities from multiple sources
    const [contractsActivity, promotersActivity] = await Promise.all([
      // Recent contract activities
      supabase
        .from('contracts')
        .select(
          `
          id,
          contract_number,
          status,
          created_at,
          updated_at,
          parties!inner(name_en, name_ar)
        `
        )
        .order('updated_at', { ascending: false })
        .limit(10),

      // Recent promoter activities
      supabase
        .from('promoters')
        .select(
          `
          id,
          name_en,
          name_ar,
          status,
          created_at,
          updated_at
        `
        )
        .order('updated_at', { ascending: false })
        .limit(10),
    ]);

    // Combine and sort all activities
    const activities = [];

    // Process contract activities
    if (contractsActivity.data) {
      contractsActivity.data.forEach(contract => {
        activities.push({
          id: `contract-${contract.id}`,
          type: 'contract',
          title: `Contract ${contract.contract_number || contract.id}`,
          description:
            contract.status === 'pending'
              ? 'Pending approval'
              : contract.status === 'active'
                ? 'Activated'
                : contract.status === 'completed'
                  ? 'Completed'
                  : 'Status updated',
          status: contract.status,
          timestamp: contract.updated_at,
          entity:
            contract.parties?.[0]?.name_en ||
            contract.parties?.[0]?.name_ar ||
            'Unknown Party',
          action:
            contract.created_at === contract.updated_at ? 'created' : 'updated',
          icon: 'FileText',
          color:
            contract.status === 'active'
              ? 'green'
              : contract.status === 'pending'
                ? 'yellow'
                : contract.status === 'completed'
                  ? 'blue'
                  : 'gray',
        });
      });
    }

    // Process promoter activities
    if (promotersActivity.data) {
      promotersActivity.data.forEach(promoter => {
        activities.push({
          id: `promoter-${promoter.id}`,
          type: 'promoter',
          title: `Promoter ${promoter.name_en || promoter.name_ar}`,
          description:
            promoter.status === 'active'
              ? 'Registered and active'
              : promoter.status === 'inactive'
                ? 'Set to inactive'
                : 'Status updated',
          status: promoter.status,
          timestamp: promoter.updated_at,
          entity: promoter.name_en || promoter.name_ar || 'Unknown Promoter',
          action:
            promoter.created_at === promoter.updated_at
              ? 'registered'
              : 'updated',
          icon: 'Users',
          color: promoter.status === 'active' ? 'green' : 'gray',
        });
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return top 15 activities
    return NextResponse.json(activities.slice(0, 15));
  } catch (error) {
    console.error('Recent activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
}
