import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/navigation/badge-counts
 * Returns badge counts for navigation items
 *
 * Returns meaningful counts that users should act on:
 * - Critical/expiring items for promoters
 * - Pending approvals for contracts
 * - Pending verifications for parties
 * - Unread notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          promoters: { critical: 0, expiring: 0 },
          contracts: { pendingApprovals: 0, expiringSoon: 0 },
          parties: { pendingVerification: 0 },
          notifications: { unread: 0 },
        },
        { status: 200 }
      );
    }

    // Get user role
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role || 'user';

    // Calculate date thresholds
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Fetch promoter counts
    const { data: promoters } = await supabase
      .from('promoters')
      .select('id, id_expiry_date, passport_expiry_date');

    let criticalPromoters = 0;
    let expiringPromoters = 0;

    if (promoters) {
      promoters.forEach(p => {
        const idExpiry = p.id_expiry_date ? new Date(p.id_expiry_date) : null;
        const passportExpiry = p.passport_expiry_date
          ? new Date(p.passport_expiry_date)
          : null;

        const idExpired = idExpiry && idExpiry < now;
        const passportExpired = passportExpiry && passportExpiry < now;
        const idExpiring =
          idExpiry && idExpiry >= now && idExpiry <= thirtyDaysFromNow;
        const passportExpiring =
          passportExpiry &&
          passportExpiry >= now &&
          passportExpiry <= thirtyDaysFromNow;

        if (idExpired || passportExpired) {
          criticalPromoters++;
        } else if (idExpiring || passportExpiring) {
          expiringPromoters++;
        }
      });
    }

    // Fetch contract counts
    let contractsQuery = supabase.from('contracts').select('status, end_date');

    // Apply RBAC
    if (userRole !== 'admin') {
      contractsQuery = contractsQuery.or(
        `first_party_id.eq.${user.id},second_party_id.eq.${user.id},client_id.eq.${user.id},employer_id.eq.${user.id}`
      );
    }

    const { data: contracts } = await contractsQuery;

    let pendingApprovals = 0;
    let expiringSoon = 0;

    if (contracts) {
      contracts.forEach(c => {
        if (
          c.status === 'pending' ||
          c.status === 'legal_review' ||
          c.status === 'hr_review' ||
          c.status === 'final_approval'
        ) {
          pendingApprovals++;
        }

        if (c.status === 'active' && c.end_date) {
          const endDate = new Date(c.end_date);
          if (endDate >= now && endDate <= thirtyDaysFromNow) {
            expiringSoon++;
          }
        }
      });
    }

    // Fetch party counts (pending verification)
    const { count: pendingPartiesCount } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    // Fetch unread notifications
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      promoters: {
        critical: criticalPromoters,
        expiring: expiringPromoters,
      },
      contracts: {
        pendingApprovals,
        expiringSoon,
      },
      parties: {
        pendingVerification: pendingPartiesCount || 0,
      },
      notifications: {
        unread: unreadNotifications || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch badge counts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
