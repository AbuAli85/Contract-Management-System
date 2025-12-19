import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const idsParam = searchParams.get('ids');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Employee IDs are required' },
        { status: 400 }
      );
    }

    const employeeIds = idsParam.split(',').filter(Boolean);

    if (employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one employee ID is required' },
        { status: 400 }
      );
    }

    // Fetch employee data
    const { data: employees, error: employeesError } = await supabase
      .from('employer_employees')
      .select(`
        id,
        employee_code,
        job_title,
        department,
        employment_type,
        employment_status,
        hire_date,
        salary,
        currency,
        work_location,
        employee:employee_id (
          id,
          email,
          full_name,
          first_name,
          last_name,
          phone
        )
      `)
      .in('id', employeeIds)
      .eq('employer_id', user.id);

    if (employeesError || !employees) {
      return NextResponse.json(
        { error: 'Failed to fetch employee data' },
        { status: 500 }
      );
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Employee Code',
        'Full Name',
        'Email',
        'Phone',
        'Job Title',
        'Department',
        'Employment Type',
        'Employment Status',
        'Hire Date',
        'Salary',
        'Currency',
        'Work Location',
      ];

      const rows = employees.map((emp: any) => [
        emp.employee_code || '',
        emp.employee?.full_name || '',
        emp.employee?.email || '',
        emp.employee?.phone || '',
        emp.job_title || '',
        emp.department || '',
        emp.employment_type || '',
        emp.employment_status || '',
        emp.hire_date || '',
        emp.salary || '',
        emp.currency || '',
        emp.work_location || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="team-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'excel') {
      // For Excel, we'd use a library like xlsx
      // For now, return CSV with Excel MIME type
      const headers = [
        'Employee Code',
        'Full Name',
        'Email',
        'Phone',
        'Job Title',
        'Department',
        'Employment Type',
        'Employment Status',
        'Hire Date',
        'Salary',
        'Currency',
        'Work Location',
      ];

      const rows = employees.map((emp: any) => [
        emp.employee_code || '',
        emp.employee?.full_name || '',
        emp.employee?.email || '',
        emp.employee?.phone || '',
        emp.job_title || '',
        emp.department || '',
        emp.employment_type || '',
        emp.employment_status || '',
        emp.hire_date || '',
        emp.salary || '',
        emp.currency || '',
        emp.work_location || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="team-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }

    if (format === 'pdf') {
      // For PDF, we'd use a library like pdfkit or puppeteer
      // For now, return a simple text representation
      const pdfContent = `Team Export Report
Generated: ${new Date().toLocaleString()}
Total Employees: ${employees.length}

${employees.map((emp: any, index: number) => `
${index + 1}. ${emp.employee?.full_name || 'N/A'}
   Code: ${emp.employee_code || 'N/A'}
   Email: ${emp.employee?.email || 'N/A'}
   Phone: ${emp.employee?.phone || 'N/A'}
   Job Title: ${emp.job_title || 'N/A'}
   Department: ${emp.department || 'N/A'}
   Status: ${emp.employment_status || 'N/A'}
`).join('\n')}
`;

      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="team-export-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid format. Use csv, excel, or pdf' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in GET /api/employer/team/bulk/export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

