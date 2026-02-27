import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';
import { logger } from '@/lib/utils/logger';
import { assertEntitlement } from '@/lib/billing/entitlements';

// Helper function to create Supabase client
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore set errors in server components
          }
        },
      },
    }
  );
}

// GET - Fetch all documents for a promoter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate promoter ID format (should be UUID)
    if (!id || typeof id !== 'string' || id.trim() === '') {
      logger.error('Invalid promoter ID:', id);
      return NextResponse.json(
        {
          error: 'Invalid promoter ID',
          details: 'Promoter ID is required and must be a valid UUID',
        },
        { status: 400 }
      );
    }

    // Validate UUID format (basic check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      logger.error('Invalid UUID format for promoter ID:', id);
      return NextResponse.json(
        {
          error: 'Invalid promoter ID format',
          details: 'Promoter ID must be a valid UUID',
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.error('Authentication error:', authError?.message || 'No user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log(`Fetching documents for promoter: ${id}, user: ${user.id}`);

    const { data, error } = await supabase
      .from('promoter_documents')
      .select('*')
      .eq('promoter_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      // Check if the error is due to missing table (relation does not exist)
      const errorMessage = error.message || '';
      const errorCode = (error as { code?: string }).code || '';
      const errorDetails = error as { details?: string; hint?: string };

      logger.error('Error fetching documents:', {
        message: errorMessage,
        code: errorCode,
        details: errorDetails.details,
        hint: errorDetails.hint,
        fullError: error,
        promoterId: id,
        userId: user.id,
      });

      // If table doesn't exist, return empty array instead of error (graceful degradation)
      if (
        (errorMessage.includes('relation') &&
          errorMessage.includes('does not exist')) ||
        errorCode === '42P01' // PostgreSQL error code for "relation does not exist"
      ) {
        logger.warn(
          'promoter_documents table does not exist - returning empty array'
        );
        return NextResponse.json({ documents: [] }, { status: 200 });
      }

      // If RLS policy issue, return empty array (graceful degradation)
      if (
        errorMessage.includes('permission denied') ||
        errorMessage.includes('policy') ||
        errorCode === '42501' // PostgreSQL error code for "insufficient privilege"
      ) {
        logger.warn('RLS policy blocking access - returning empty array');
        return NextResponse.json({ documents: [] }, { status: 200 });
      }

      // For other errors, log the full error for debugging
      // But return empty array gracefully to prevent UI breakage
      logger.error('Database error fetching documents:', {
        errorMessage,
        errorCode,
        errorDetails: errorDetails.details,
        errorHint: errorDetails.hint,
        promoterId: id,
        userId: user.id,
        fullError: error,
      });

      // Return empty array gracefully - this prevents the UI from breaking
      // The error is logged for debugging purposes
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    logger.log(
      `Successfully fetched ${data?.length || 0} documents for promoter ${id}`
    );
    return NextResponse.json({ documents: data || [] }, { status: 200 });
  } catch (error) {
    logger.error('Documents API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoterId } = await params;
    const supabase = await createSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Enforce storage / document upload entitlement
    try {
      await assertEntitlement(null, 'storage_gb', 1);
    } catch (entitlementError: any) {
      return NextResponse.json(
        {
          error: 'Storage limit reached for current subscription plan',
          details: entitlementError.message,
        },
        { status: 402 }
      );
    }

    const body = await request.json();
    const { document_type, file_name, file_path, file_size, mime_type, notes } =
      body;

    // Validate required fields
    if (!document_type || !file_name || !file_path) {
      return NextResponse.json(
        {
          error: 'Missing required fields: document_type, file_name, file_path',
        },
        { status: 400 }
      );
    }

    // Insert document
    const { data, error } = await supabase
      .from('promoter_documents')
      .insert({
        promoter_id: promoterId,
        document_type,
        file_name,
        file_path,
        file_size,
        mime_type,
        notes,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating document:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, document: data },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Create document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a specific document
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoterId } = await params;
    const supabase = await createSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, ...updateData } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Remove fields that shouldn't be updated
    const safeUpdateData = updateData as Record<string, unknown>;
    delete safeUpdateData.id;
    delete safeUpdateData.promoter_id;
    delete safeUpdateData.created_at;

    // Update document
    const { data, error } = await supabase
      .from('promoter_documents')
      .update(safeUpdateData)
      .eq('id', documentId)
      .eq('promoter_id', promoterId) // Ensure the document belongs to this promoter
      .select()
      .single();

    if (error) {
      logger.error('Error updating document:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, document: data },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoterId } = await params;
    const supabase = await createSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get documentId from query params or body
    const url = new URL(request.url);
    const documentIdFromQuery = url.searchParams.get('documentId');

    let documentId = documentIdFromQuery;

    // If not in query params, try to get from body
    if (!documentId) {
      try {
        const body = await request.json();
        documentId = body.documentId;
      } catch {
        // Body might be empty or invalid JSON
      }
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required (as query param or in body)' },
        { status: 400 }
      );
    }

    // First, get the document to check if it exists and get file path for cleanup
    const { data: document, error: fetchError } = await supabase
      .from('promoter_documents')
      .select('*')
      .eq('id', documentId)
      .eq('promoter_id', promoterId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the document record
    const { error: deleteError } = await supabase
      .from('promoter_documents')
      .delete()
      .eq('id', documentId)
      .eq('promoter_id', promoterId);

    if (deleteError) {
      logger.error('Error deleting document:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // Delete the file from storage if a file_path exists
    if ((document as any).file_path) {
      try {
        const filePath = (document as any).file_path;
        // Extract the path relative to the bucket
        const bucketPath = filePath.includes('/storage/v1/object/public/')
          ? filePath.split('/storage/v1/object/public/').pop()?.split('/').slice(1).join('/')
          : filePath;
        if (bucketPath) {
          const bucket = filePath.includes('promoter-documents') ? 'promoter-documents' : 'documents';
          await supabase.storage.from(bucket).remove([bucketPath]);
        }
      } catch (storageError) {
        // Log but don't fail the request if storage cleanup fails
        logger.warn('Storage cleanup failed for document:', (document as any).id, storageError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Document deleted successfully',
        deletedDocument: document,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
