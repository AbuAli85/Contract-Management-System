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

      // Find the correct PDF file in storage
      let pdfFileName: string | null = null;
      let pdfUrl: string | null = contract.pdf_url || null;

      if (contract.pdf_url && contract.contract_number) {
        try {
          // Extract filename from URL
          const urlParts = contract.pdf_url.split('/contracts/');
          const storedFilename = urlParts.length > 1 ? urlParts[1] : null;
          
          // List files in storage
          const { data: fileList } = await supabase.storage
            .from('contracts')
            .list('', {
              limit: 100,
            });
          
          // Check if stored file exists
          const fileExists = storedFilename && fileList?.some(file => file.name === storedFilename);
          
          if (fileExists && storedFilename) {
            // Use the stored filename
            pdfFileName = storedFilename;
            console.log('✅ Found PDF file in storage:', pdfFileName);
          } else if (fileList) {
            // Search for files matching contract number
            const matchingFiles = fileList.filter(
              (file) =>
                file.name.startsWith(contract.contract_number) &&
                file.name.endsWith('.pdf')
            );
            
            if (matchingFiles.length > 0) {
              // Get the most recent matching file
              const matchingFile = matchingFiles.sort((a, b) => {
                const aTime = new Date(a.created_at || 0).getTime();
                const bTime = new Date(b.created_at || 0).getTime();
                return bTime - aTime;
              })[0];
              
              pdfFileName = matchingFile.name;
              
              // Update contract with correct URL in background
              const { data: { publicUrl } } = supabase.storage
                .from('contracts')
                .getPublicUrl(matchingFile.name);
              
              pdfUrl = publicUrl;
              
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
              
              console.log('🔧 Found correct PDF file:', pdfFileName);
            }
          }
        } catch (fixError) {
          console.warn('⚠️ Could not find PDF file in storage:', fixError);
        }
      }

      // Try to fetch PDF from storage first
      if (pdfFileName) {
        try {
          console.log('📥 Fetching PDF from storage:', pdfFileName);
          console.log('📥 Filename length:', pdfFileName.length);
          console.log('📥 Filename includes space:', pdfFileName.includes(' '));
          
          const { data: pdfData, error: downloadError } = await supabase.storage
            .from('contracts')
            .download(pdfFileName);
          
          if (!downloadError && pdfData) {
            const arrayBuffer = await pdfData.arrayBuffer();
            const pdfBuffer = new Uint8Array(arrayBuffer);
            
            console.log('✅ PDF fetched from storage:', pdfBuffer.length, 'bytes');
            
            // URL encode filename for Content-Disposition header if it contains spaces
            const encodedFileName = pdfFileName.includes(' ') 
              ? pdfFileName.replace(/ /g, '%20')
              : pdfFileName;
            
            // Return the PDF from storage
            return new NextResponse(pdfBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${pdfFileName}"; filename*=UTF-8''${encodedFileName}`,
                'Cache-Control': 'public, max-age=3600',
              },
            });
          } else {
            console.error('⚠️ Failed to download PDF from storage:', downloadError);
            console.error('⚠️ Error details:', JSON.stringify(downloadError, null, 2));
            // Fall through to generate PDF on-demand
          }
        } catch (fetchError) {
          console.error('⚠️ Error fetching PDF from storage:', fetchError);
          console.error('⚠️ Fetch error details:', fetchError instanceof Error ? fetchError.message : String(fetchError));
          // Fall through to generate PDF on-demand
        }
      } else {
        console.warn('⚠️ No PDF filename found, cannot fetch from storage');
      }

      // Fallback: Generate PDF on-demand if not found in storage
      if (!hasPDF) {
        console.log('❌ No PDF available for contract');
        return NextResponse.json(
          { error: 'PDF not available for this contract' },
          { status: 404 }
        );
      }

      console.log('📄 Generating PDF on-demand (file not found in storage)');

      try {
        const pdfBuffer = await generateContractPDF(contract);
        
        // Return the generated PDF content
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
