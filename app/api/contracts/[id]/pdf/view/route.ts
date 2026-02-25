import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { withRBAC } from '@/lib/rbac/guard';

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

      // ✅ SECURITY: Non-admin users can only see contracts they're involved in
      // Note: RBAC guard already checks permissions, but we add additional checks here
      if (!isAdmin) {
        const isInvolved =
          contract.client_id === user.id ||
          contract.employer_id === user.id ||
          contract.first_party_id === user.id ||
          contract.second_party_id === user.id ||
          contract.created_by === user.id ||
          contract.user_id === user.id;

        if (!isInvolved) {
          return NextResponse.json(
            { error: 'Unauthorized to view this contract' },
            { status: 403 }
          );
        }
      }

      // Check if contract is approved and has PDF
      const isApproved =
        contract.status === 'approved' ||
        contract.approval_status === 'approved';
      const _hasPDF = !!contract.pdf_url;
      if (!isApproved) {
        return NextResponse.json(
          { error: 'Contract is not approved yet' },
          { status: 403 }
        );
      }

      // Find the correct PDF file in storage - MUST fetch from storage, never generate
      let pdfFileName: string | null = null;
      let _pdfUrl: string | null = contract.pdf_url || null;

      if (!contract.contract_number) {
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


        // List ALL files in storage using service client
        const { data: fileList, error: listError } = await serviceClient.storage
          .from('contracts')
          .list('', {
            limit: 1000, // Increased limit to find all files
          });

        if (listError) {
          return NextResponse.json(
            { error: 'Failed to access storage', details: listError.message },
            { status: 500 }
          );
        }


        // Log first few file names for debugging
        if (fileList && fileList.length > 0) {
        }

        // First, try exact match with stored filename (decoded)
        if (storedFilename && fileList) {
          const exactMatch = fileList.find(
            file => file.name === storedFilename
          );
          if (exactMatch) {
            pdfFileName = exactMatch.name;
          } else {
          }
        }

        // If no exact match, search for files matching contract number
        if (!pdfFileName && fileList) {
          const matchingFiles = fileList.filter(
            file =>
              file.name.startsWith(contract.contract_number!) &&
              file.name.endsWith('.pdf')
          );

          if (matchingFiles.length > 0) {

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
              const {
                data: { publicUrl },
              } = serviceClient.storage
                .from('contracts')
                .getPublicUrl(matchingFile.name);

              _pdfUrl = publicUrl;

              // Update contract with correct URL (fire and forget)
              void (async () => {
                try {
                  await serviceClient
                    .from('contracts')
                    .update({ pdf_url: publicUrl })
                    .eq('id', contractId);
                } catch (err: unknown) {
                }
              })();

            }
          } else {
            // Log all PDF files for debugging
            const allPdfs = fileList.filter(f => f.name.endsWith('.pdf'));
            if (allPdfs.length > 0) {
            }
          }
        }
      } catch (fixError) {
        return NextResponse.json(
          {
            error: 'Failed to search for PDF file',
            details:
              fixError instanceof Error ? fixError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }

      // MUST fetch PDF from storage - never generate if pdf_url exists
      if (!pdfFileName) {
        return NextResponse.json(
          {
            error: 'PDF file not found in storage',
            contractNumber: contract.contract_number,
            storedUrl: contract.pdf_url,
            message:
              'The PDF file does not exist in Supabase storage. Please regenerate the PDF or check the file name.',
          },
          { status: 404 }
        );
      }

      // Fetch the actual PDF file from storage using service client
      try {

        const { data: pdfData, error: downloadError } =
          await serviceClient.storage.from('contracts').download(pdfFileName);

        if (downloadError) {
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
          return NextResponse.json(
            { error: 'PDF file is empty or corrupted' },
            { status: 500 }
          );
        }

        const arrayBuffer = await pdfData.arrayBuffer();
        const pdfBuffer = new Uint8Array(arrayBuffer);

        if (pdfBuffer.length === 0) {
          return NextResponse.json(
            { error: 'PDF file is empty' },
            { status: 500 }
          );
        }


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
        return NextResponse.json(
          {
            error: 'Failed to fetch PDF from storage',
            details:
              fetchError instanceof Error
                ? fetchError.message
                : 'Unknown error',
            fileName: pdfFileName,
          },
          { status: 500 }
        );
      }
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
