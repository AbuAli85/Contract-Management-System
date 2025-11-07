import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';
import { generateContractPDF } from '@/lib/pdf-generator';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/contracts/[id]/pdf/view - View/display PDF for a contract
export const GET = withRBAC(
  'contract:read:own',
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id: contractId } = await params;

      console.log('🔍 PDF view API called for contract:', contractId);

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
      const isApproved = contract.status === 'approved' || contract.approval_status === 'approved';
      let hasPDF = !!contract.pdf_url;

      if (!isApproved) {
        console.log('❌ Contract not approved:', contract.approval_status);
        return NextResponse.json(
          { error: 'Contract is not approved yet' },
          { status: 403 }
        );
      }

      // If PDF URL exists but might be incorrect, try to fix it automatically
      if (contract.pdf_url && contract.contract_number) {
        try {
          // Check if the stored URL points to a file that doesn't exist
          const urlParts = contract.pdf_url.split('/contracts/');
          if (urlParts.length > 1) {
            const storedFilename = urlParts[1];
            
            // Try to verify file exists
            const { data: fileList } = await supabase.storage
              .from('contracts')
              .list('', {
                limit: 100,
              });
            
            const fileExists = fileList?.some(file => file.name === storedFilename);
            
            // If file doesn't exist, search for correct file
            if (!fileExists && fileList) {
              const matchingFiles = fileList.filter(
                (file) =>
                  file.name.startsWith(contract.contract_number) &&
                  file.name.endsWith('.pdf')
              );
              
              if (matchingFiles.length > 0) {
                const matchingFile = matchingFiles.sort((a, b) => {
                  const aTime = new Date(a.created_at || 0).getTime();
                  const bTime = new Date(b.created_at || 0).getTime();
                  return bTime - aTime;
                })[0];
                
                // Update contract with correct URL in background (don't wait)
                const { data: { publicUrl } } = supabase.storage
                  .from('contracts')
                  .getPublicUrl(matchingFile.name);
                
                supabase
                  .from('contracts')
                  .update({ pdf_url: publicUrl })
                  .eq('id', contractId)
                  .then(() => {
                    console.log('✅ Auto-fixed PDF URL:', matchingFile.name);
                  })
                  .catch((err) => {
                    console.warn('⚠️ Failed to auto-fix PDF URL:', err);
                  });
                
                console.log('🔧 Auto-correcting PDF URL from', storedFilename, 'to', matchingFile.name);
              }
            }
          }
        } catch (fixError) {
          console.warn('⚠️ Could not auto-fix PDF URL:', fixError);
          // Continue anyway - we'll generate PDF on-demand
        }
      }

      if (!hasPDF) {
        console.log('❌ No PDF available for contract');
        return NextResponse.json(
          { error: 'PDF not available for this contract' },
          { status: 404 }
        );
      }

      console.log('✅ PDF view authorized, generating actual PDF content');

      // Generate the actual PDF content using the contract data
      try {
        const pdfBuffer = await generateContractPDF(contract);
        
        // Return the actual PDF content
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${contract.contract_number || contractId}-contract.pdf"`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError);
        return NextResponse.json(
          { error: 'Failed to generate PDF', details: pdfError instanceof Error ? pdfError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('❌ Error in GET /api/contracts/[id]/pdf/view:', error);
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
