import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// POST /api/contracts/[id]/generate-pdf - Generate PDF for a contract
export const POST = withRBAC(
  'contract:update:own',
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id: contractId } = await params;

      // Get current user to check permissions
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has permission to generate PDFs
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (
        userError ||
        !userProfile ||
        !['admin', 'manager'].includes((userProfile as any)?.role)
      ) {
        return NextResponse.json(
          { error: 'Insufficient permissions to generate PDFs' },
          { status: 403 }
        );
      }

      // Fetch contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      // Check if contract is approved
      if (contract.approval_status !== 'active') {
        return NextResponse.json(
          { error: 'Contract must be approved before generating PDF' },
          { status: 400 }
        );
      }

      // TODO: Implement actual PDF generation logic here
      // For now, we'll simulate the process
      console.log(`Generating PDF for contract ${contractId}...`);

      // Simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a mock PDF URL (replace with actual PDF generation)
      const mockPdfUrl = `https://portal.thesmartpro.io/api/contracts/${contractId}/pdf/download`;

      // Update contract with PDF URL
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          pdf_url: mockPdfUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (updateError) {
        console.error('Error updating contract with PDF URL:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update contract with PDF URL',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // Log the activity
      try {
        await supabase.from('user_activity_log').insert({
          user_id: user.id,
          action: 'pdf_generation',
          resource_type: 'contract',
          resource_id: contractId,
          details: {
            pdf_url: mockPdfUrl,
            contract_number: contract.contract_number,
          },
        } as any);
      } catch (logError) {
        console.warn('Could not log activity:', logError);
        // Continue execution even if logging fails
      }

      return NextResponse.json(
        {
          success: true,
          message: 'PDF generated successfully!',
          pdf_url: mockPdfUrl,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in POST /api/contracts/[id]/generate-pdf:', error);
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
