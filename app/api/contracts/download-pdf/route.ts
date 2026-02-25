import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/contracts/download-pdf - Get PDF status for a contract
export const GET = withRBAC(
  'contract:read:own',
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);
      const contractId = searchParams.get('contractId');

      if (!contractId) {
        return NextResponse.json(
          { error: 'Contract ID is required' },
          { status: 400 }
        );
      }

      // Get current user to check permissions
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user role for scoping
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = (userProfile as any)?.role === 'admin';

      // Fetch contract
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Contract not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          {
            error: 'Failed to fetch contract',
            details: error.message,
          },
          { status: 500 }
        );
      }

      // ✅ SECURITY: Non-admin users can only see contracts they're involved in
      if (!isAdmin) {
        const isInvolved =
          contract.client_id === user.id ||
          contract.employer_id === user.id ||
          contract.first_party_id === user.id ||
          contract.second_party_id === user.id;

        if (!isInvolved) {
          return NextResponse.json(
            { error: 'Unauthorized to view this contract' },
            { status: 403 }
          );
        }
      }

      // Check if contract is approved
      const isApproved =
        contract.status === 'approved' ||
        contract.approval_status === 'approved';
      const hasPDF = !!contract.pdf_url;
      const canDownload = isApproved && hasPDF;

      // Get notifications (placeholder - implement based on your notification system)
      const notifications: any[] = [];

      return NextResponse.json(
        {
          success: true,
          can_download: canDownload,
          has_pdf: hasPDF,
          contract: {
            pdf_url: contract.pdf_url,
            approval_status: contract.approval_status,
          },
          notifications,
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
