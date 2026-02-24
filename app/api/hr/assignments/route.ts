import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - List assignments
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
    const clientPartyId = searchParams.get('client_party_id');
    const status = searchParams.get('status');
    const activeOnly = searchParams.get('active_only') === 'true';

    // Get user's active company
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    let query = (supabaseAdmin.from('client_assignments') as any).select(`
        *,
        employer_employee:employer_employee_id (
          id,
          employee_id,
          employer_id,
          company_id,
          job_title,
          employee:employee_id (
            id,
            name_en,
            name_ar,
            email
          )
        ),
        client:client_party_id (
          id,
          name_en,
          name_ar,
          contact_email,
          contact_phone
        ),
        deployment_letter:deployment_letter_id (
          id,
          contract_number,
          status
        )
      `);

    // Company scoping
    if (userProfile?.role !== 'admin') {
      query = query.eq(
        'employer_employee.company_id',
        userProfile?.active_company_id
      );
    }

    // Filter by employee
    if (employerEmployeeId) {
      query = query.eq('employer_employee_id', employerEmployeeId);
    }

    // Filter by client
    if (clientPartyId) {
      query = query.eq('client_party_id', clientPartyId);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    } else if (activeOnly) {
      query = query.eq('status', 'active');
    }

    query = query.order('created_at', { ascending: false });

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assignments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
      count: assignments?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/hr/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create assignment
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
      client_party_id,
      assignment_type,
      job_title,
      department,
      work_location,
      start_date,
      end_date,
      deployment_letter_id,
      assignment_terms,
      client_contact_person,
      client_contact_email,
      client_contact_phone,
      salary_at_assignment,
      currency,
      notes,
      generate_deployment_letter,
    } = body;

    // Validate required fields
    if (
      !employer_employee_id ||
      !client_party_id ||
      !job_title ||
      !start_date
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: employer_employee_id, client_party_id, job_title, start_date',
        },
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
      .select('id, employer_id, company_id, employee_id, salary')
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
      if (employee.employer_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - You can only assign your own employees' },
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

    // Verify client exists
    const { data: client } = await supabase
      .from('parties')
      .select('id')
      .eq('id', client_party_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create assignment
    const { data: assignment, error: createError } = await (
      supabaseAdmin.from('client_assignments') as any
    )
      .insert({
        employer_employee_id,
        client_party_id,
        assignment_type: assignment_type || 'deployment',
        job_title,
        department: department || null,
        work_location: work_location || null,
        start_date,
        end_date: end_date || null,
        deployment_letter_id: deployment_letter_id || null,
        assignment_terms: assignment_terms || {},
        client_contact_person: client_contact_person || null,
        client_contact_email: client_contact_email || null,
        client_contact_phone: client_contact_phone || null,
        salary_at_assignment: salary_at_assignment || employee.salary || null,
        currency: currency || 'OMR',
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating assignment:', createError);
      return NextResponse.json(
        { error: 'Failed to create assignment', details: createError.message },
        { status: 500 }
      );
    }

    // If generate_deployment_letter is true, trigger deployment letter generation
    const deploymentLetterId = assignment.deployment_letter_id;
    if (generate_deployment_letter && !deployment_letter_id) {
      // This would call the deployment letter generation API
      // For now, we'll just return the assignment
      // In production, you'd call: /api/deployment-letters/generate
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      assignment,
      deployment_letter_id: deploymentLetterId,
    });
  } catch (error) {
    console.error('Error in POST /api/hr/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
