import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/contracts/[id]/pdf/download - Download PDF for a contract
export const GET = withRBAC(
  'contract:read:own',
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id: contractId } = await params;

      console.log('🔍 PDF download API called for contract:', contractId);

      // Get current user to check permissions
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('❌ Authentication failed:', authError);
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
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        console.log('❌ Contract not found:', contractError);
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
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
          console.log('❌ User not authorized to view this contract');
          return NextResponse.json(
            { error: 'Unauthorized to view this contract' },
            { status: 403 }
          );
        }
      }

      // Check if contract is approved and has PDF
      const isApproved = contract.approval_status === 'active';
      const hasPDF = !!contract.pdf_url;

      if (!isApproved) {
        console.log('❌ Contract not approved:', contract.approval_status);
        return NextResponse.json(
          { error: 'Contract is not approved yet' },
          { status: 403 }
        );
      }

      if (!hasPDF) {
        console.log('❌ No PDF available for contract');
        return NextResponse.json(
          { error: 'PDF not available for this contract' },
          { status: 404 }
        );
      }

      console.log('✅ PDF download authorized, redirecting to:', contract.pdf_url);

      // Redirect to the PDF URL (external service or file storage)
      return NextResponse.redirect(contract.pdf_url, 302);
    } catch (error) {
      console.error('❌ Error in GET /api/contracts/[id]/pdf/download:', error);
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
