import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { withRBAC } from '@/lib/rbac/guard';
import { generateContractPDF } from '@/lib/pdf-generator';

// Create Supabase service client for storage operations
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

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

      // Find the correct PDF file in storage - MUST fetch from storage, never generate
      let pdfFileName: string | null = null;
      let pdfUrl: string | null = contract.pdf_url || null;

      if (!contract.contract_number) {
        console.error('❌ Contract number missing, cannot search for PDF');
        return NextResponse.json(
          { error: 'Contract number is required to find PDF file' },
          { status: 400 }
        );
      }

      // Use service client for storage operations (has elevated permissions)
      const serviceClient = createServiceClient();

      try {
        // Extract filename from URL (decode URL encoding)
        let storedFilename: string | null = null;
        if (contract.pdf_url) {
          const urlParts = contract.pdf_url.split('/contracts/');
          if (urlParts.length > 1) {
            storedFilename = decodeURIComponent(urlParts[1]); // Decode %20 to space
          }
        }
        
        console.log('🔍 Searching for PDF file...');
        console.log('📋 Contract number:', contract.contract_number);
        console.log('📋 Stored filename from URL:', storedFilename);
        console.log('📋 Full stored URL:', contract.pdf_url);
        
        // List ALL files in storage using service client
        const { data: fileList, error: listError } = await serviceClient.storage
          .from('contracts')
          .list('', {
            limit: 1000, // Increased limit to find all files
          });
        
        if (listError) {
          console.error('❌ Error listing storage files:', listError);
          console.error('❌ List error details:', JSON.stringify(listError, null, 2));
          return NextResponse.json(
            { error: 'Failed to access storage', details: listError.message },
            { status: 500 }
          );
        }
        
        console.log(`📁 Found ${fileList?.length || 0} files in storage`);
        
        // Log first few file names for debugging
        if (fileList && fileList.length > 0) {
          console.log('📄 Sample files:', fileList.slice(0, 5).map(f => f.name));
        }
        
        // First, try exact match with stored filename (decoded)
        if (storedFilename && fileList) {
          const exactMatch = fileList.find(file => file.name === storedFilename);
          if (exactMatch) {
            pdfFileName = exactMatch.name;
            console.log('✅ Found exact match:', pdfFileName);
          } else {
            console.log('⚠️ No exact match found for:', storedFilename);
          }
        }
        
        // If no exact match, search for files matching contract number
        if (!pdfFileName && fileList) {
          console.log(`🔍 Searching for files starting with: "${contract.contract_number}"`);
          const matchingFiles = fileList.filter(
            (file) =>
              file.name.startsWith(contract.contract_number!) &&
              file.name.endsWith('.pdf')
          );
          
          console.log(`🔍 Found ${matchingFiles.length} files matching contract number`);
          if (matchingFiles.length > 0) {
            console.log('📋 Matching files:', matchingFiles.map(f => f.name));
            
            // Get the most recent matching file
            const sortedFiles = matchingFiles.sort((a, b) => {
              const aTime = new Date(a.created_at || 0).getTime();
              const bTime = new Date(b.created_at || 0).getTime();
              return bTime - aTime;
            });
            
            const matchingFile = sortedFiles[0];
            
            if (matchingFile) {
              pdfFileName = matchingFile.name;
              
              // Update contract with correct URL in background using service client
              const { data: { publicUrl } } = serviceClient.storage
                .from('contracts')
                .getPublicUrl(matchingFile.name);
              
              pdfUrl = publicUrl;
              
              // Update contract with correct URL (fire and forget)
              void (async () => {
                try {
                  await serviceClient
                    .from('contracts')
                    .update({ pdf_url: publicUrl })
                    .eq('id', contractId);
                  console.log('✅ Auto-fixed PDF URL:', matchingFile.name);
                } catch (err: unknown) {
                  console.warn('⚠️ Failed to auto-fix PDF URL:', err);
                }
              })();
              
              console.log('🔧 Found matching PDF file:', pdfFileName);
            }
          } else {
            console.log('❌ No files found matching contract number pattern');
            // Log all PDF files for debugging
            const allPdfs = fileList.filter(f => f.name.endsWith('.pdf'));
            console.log(`📄 Total PDF files in storage: ${allPdfs.length}`);
            if (allPdfs.length > 0) {
              console.log('📄 Sample PDF files:', allPdfs.slice(0, 10).map(f => f.name));
            }
          }
        }
      } catch (fixError) {
        console.error('❌ Error searching for PDF file:', fixError);
        console.error('❌ Error stack:', fixError instanceof Error ? fixError.stack : 'No stack trace');
        return NextResponse.json(
          { error: 'Failed to search for PDF file', details: fixError instanceof Error ? fixError.message : 'Unknown error' },
          { status: 500 }
        );
      }

      // MUST fetch PDF from storage - never generate if pdf_url exists
      if (!pdfFileName) {
        console.error('❌ PDF file not found in storage');
        console.error('📋 Contract number:', contract.contract_number);
        console.error('📋 Stored PDF URL:', contract.pdf_url);
        return NextResponse.json(
          { 
            error: 'PDF file not found in storage',
            contractNumber: contract.contract_number,
            storedUrl: contract.pdf_url,
            message: 'The PDF file does not exist in Supabase storage. Please regenerate the PDF or check the file name.',
          },
          { status: 404 }
        );
      }

      // Fetch the actual PDF file from storage using service client
      try {
        console.log('📥 Fetching PDF from storage:', pdfFileName);
        console.log('📥 Filename length:', pdfFileName.length);
        console.log('📥 Filename includes space:', pdfFileName.includes(' '));
        
        const { data: pdfData, error: downloadError } = await serviceClient.storage
          .from('contracts')
          .download(pdfFileName);
        
        if (downloadError) {
          console.error('❌ Failed to download PDF from storage:', downloadError);
          console.error('❌ Error details:', JSON.stringify(downloadError, null, 2));
          return NextResponse.json(
            { 
              error: 'Failed to download PDF from storage',
              details: downloadError.message,
              fileName: pdfFileName,
            },
            { status: 500 }
          );
        }

        if (!pdfData) {
          console.error('❌ PDF data is null');
          return NextResponse.json(
            { error: 'PDF file is empty or corrupted' },
            { status: 500 }
          );
        }

        const arrayBuffer = await pdfData.arrayBuffer();
        const pdfBuffer = new Uint8Array(arrayBuffer);
        
        if (pdfBuffer.length === 0) {
          console.error('❌ PDF buffer is empty');
          return NextResponse.json(
            { error: 'PDF file is empty' },
            { status: 500 }
          );
        }
        
        console.log('✅ PDF fetched from storage:', pdfBuffer.length, 'bytes');
        
        // URL encode filename for Content-Disposition header if it contains spaces
        const encodedFileName = pdfFileName.includes(' ') 
          ? encodeURIComponent(pdfFileName)
          : pdfFileName;
        
        // Return the actual PDF from storage (not generated)
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${pdfFileName}"; filename*=UTF-8''${encodedFileName}`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (fetchError) {
        console.error('❌ Error fetching PDF from storage:', fetchError);
        console.error('❌ Fetch error details:', fetchError instanceof Error ? fetchError.message : String(fetchError));
        return NextResponse.json(
          { 
            error: 'Failed to fetch PDF from storage',
            details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
            fileName: pdfFileName,
          },
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
