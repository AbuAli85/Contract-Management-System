import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - List documents for employees
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employerEmployeeId = searchParams.get('employer_employee_id');
    const documentType = searchParams.get('document_type');
    const status = searchParams.get('status');
    const expiringSoon = searchParams.get('expiring_soon') === 'true';

    // Get user's active company
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    let query = (supabaseAdmin.from('employee_documents') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          id,
          employee_id,
          employer_id,
          company_id,
          employee:employee_id (
            id,
            name_en,
            name_ar,
            email
          )
        )
      `);

    // Company scoping
    if (userProfile?.role !== 'admin') {
      // Filter by company
      query = query.eq('employer_employee.company_id', userProfile?.active_company_id);
    }

    // Filter by employee if specified
    if (employerEmployeeId) {
      query = query.eq('employer_employee_id', employerEmployeeId);
    }

    // Filter by document type
    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter expiring soon (within 30 days)
    if (expiringSoon) {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      query = query
        .not('expiry_date', 'is', null)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .eq('status', 'verified');
    }

    query = query.order('created_at', { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
      count: documents?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/hr/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload/create document
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      employer_employee_id,
      document_type,
      document_name,
      file_url,
      file_name,
      file_size,
      mime_type,
      expiry_date,
      issue_date,
      issuing_authority,
      document_number,
      notes,
    } = body;

    // Validate required fields
    if (!employer_employee_id || !document_type || !document_name || !file_url) {
      return NextResponse.json(
        { error: 'Missing required fields: employer_employee_id, document_type, document_name, file_url' },
        { status: 400 }
      );
    }

    // Verify employee belongs to user's company
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    const { data: employee } = await supabase
      .from('employer_employees')
      .select('id, employer_id, company_id, employee_id')
      .eq('id', employer_employee_id)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (userProfile?.role !== 'admin') {
      if (employee.employer_id !== user.id && employee.employee_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - You can only upload documents for your own employees' },
          { status: 403 }
        );
      }

      // Company scoping
      if (employee.company_id !== userProfile?.active_company_id) {
        return NextResponse.json(
          { error: 'Employee does not belong to your active company' },
          { status: 403 }
        );
      }
    }

    // Create document record
    const { data: document, error: createError } = await (supabaseAdmin.from('employee_documents') as any)
      .insert({
        employer_employee_id,
        document_type,
        document_name,
        file_url,
        file_name: file_name || null,
        file_size: file_size || null,
        mime_type: mime_type || null,
        expiry_date: expiry_date || null,
        issue_date: issue_date || null,
        issuing_authority: issuing_authority || null,
        document_number: document_number || null,
        notes: notes || null,
        status: 'pending', // Default to pending, needs verification
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating document:', createError);
      return NextResponse.json(
        { error: 'Failed to create document', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document,
    });
  } catch (error) {
    console.error('Error in POST /api/hr/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

