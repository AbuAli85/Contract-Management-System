import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create Supabase service client
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// POST /api/contracts/[id]/fix-pdf-url - Fix incorrect PDF URL by searching storage
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const supabase = createServiceClient();


    // 1. Get contract data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, contract_number, pdf_url')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (!contract.contract_number) {
      return NextResponse.json(
        { error: 'Contract number not found' },
        { status: 400 }
      );
    }


    // 2. Search storage for files starting with contract number
    const bucketName = 'contracts';
    let allFiles: any[] = [];

    try {
      // List all files in the bucket (we'll filter by contract number)
      const { data: fileList, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 1000, // Adjust if you have more files
        });

      if (listError) {
        return NextResponse.json(
          { error: 'Failed to list storage files', details: listError.message },
          { status: 500 }
        );
      }

      allFiles = fileList || [];

      // Filter files that start with contract number and end with .pdf
      const matchingFiles = allFiles.filter(
        file =>
          file.name.startsWith(contract.contract_number) &&
          file.name.endsWith('.pdf')
      );


      if (matchingFiles.length === 0) {
        return NextResponse.json(
          {
            error: 'No PDF file found in storage',
            contractNumber: contract.contract_number,
            message:
              'No PDF file found in storage that matches this contract number',
          },
          { status: 404 }
        );
      }

      // 3. Find the most recent file (or the one that matches the pattern)
      const matchingFile = matchingFiles.sort((a, b) => {
        // Sort by created_at descending (most recent first)
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      })[0];


      // 4. Generate correct public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(matchingFile.name);


      // 5. Update contract with correct URL
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          pdf_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (updateError) {
        return NextResponse.json(
          {
            error: 'Failed to update contract',
            details: updateError.message,
          },
          { status: 500 }
        );
      }


      return NextResponse.json({
        success: true,
        contractId,
        contractNumber: contract.contract_number,
        oldUrl: contract.pdf_url,
        newUrl: publicUrl,
        fileName: matchingFile.name,
        message: 'PDF URL fixed successfully',
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
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
