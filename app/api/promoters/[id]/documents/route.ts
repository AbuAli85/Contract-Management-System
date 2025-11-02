import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, ...options }: any) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore set errors in server components
          }
        },
      } as any,
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
    const supabase = await createSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('promoter_documents')
      .select('*')
      .eq('promoter_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ documents: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      document_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      notes,
    } = body;

    // Validate required fields
    if (!document_type || !file_name || !file_path) {
      return NextResponse.json(
        { error: 'Missing required fields: document_type, file_name, file_path' },
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
      console.error('Error creating document:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, document: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create document error:', error);
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    delete (updateData as any).id;
    delete (updateData as any).promoter_id;
    delete (updateData as any).created_at;

    // Update document
    const { data, error } = await supabase
      .from('promoter_documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('promoter_id', promoterId) // Ensure the document belongs to this promoter
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
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
    console.error('Update document error:', error);
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
      console.error('Error deleting document:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // Optionally, delete the file from storage
    // You can add storage deletion logic here if needed
    // Example:
    // if (document.file_path) {
    //   const filePath = document.file_path.split('/').pop();
    //   await supabase.storage.from('documents').remove([filePath]);
    // }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Document deleted successfully',
        deletedDocument: document 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
