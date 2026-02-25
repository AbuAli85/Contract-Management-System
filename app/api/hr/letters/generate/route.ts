import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// POST - Generate various types of letters
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
      letter_type, // 'salary_certificate', 'official', 'leave', 'employment', 'experience', 'no_objection'
      employer_employee_id,
      subject,
      content,
      additional_data = {},
      template_id,
    } = body;

    // Validate required fields
    if (!letter_type || !employer_employee_id) {
      return NextResponse.json(
        { error: 'letter_type and employer_employee_id are required' },
        { status: 400 }
      );
    }

    // Get employee information
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select(
        `
        *,
        employee:profiles!employer_employees_employee_id_fkey(
          id,
          name_en,
          name_ar,
          email,
          phone
        ),
        employer:profiles!employer_employees_employer_id_fkey(
          id,
          name_en,
          name_ar
        )
      `
      )
      .eq('id', employer_employee_id)
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_company_id')
      .eq('id', user.id)
      .single();

    const isEmployer = employeeLink.employer_id === user.id;
    const isAdmin = profile?.role === 'admin';
    const isHR = profile?.role === 'hr_manager' || profile?.role === 'manager';
    const isSameCompany =
      profile?.active_company_id === employeeLink.company_id;

    if (!isEmployer && !isAdmin && !(isHR && isSameCompany)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Generate letter content based on type
    let letterContent = content;
    let letterSubject = subject;

    if (!letterContent) {
      // Auto-generate content based on letter type
      letterContent = generateLetterContent(
        letter_type,
        employeeLink,
        additional_data
      );
    }

    if (!letterSubject) {
      letterSubject = generateLetterSubject(letter_type, employeeLink);
    }

    // Create letter record
    const { data: letter, error: createError } = await (
      supabaseAdmin.from('hr_letters') as any
    )
      .insert({
        letter_type,
        employer_employee_id,
        subject: letterSubject,
        content: letterContent,
        additional_data,
        template_id: template_id || null,
        generated_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create letter', details: createError.message },
        { status: 500 }
      );
    }

    // Generate PDF (you can integrate with your PDF generation service)
    // For now, return the letter data
    return NextResponse.json({
      success: true,
      message: 'Letter generated successfully',
      letter: {
        ...letter,
        pdf_url: null, // Will be generated asynchronously
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateLetterContent(
  letterType: string,
  employeeLink: any,
  additionalData: any
): string {
  const employee = employeeLink.employee;
  const employer = employeeLink.employer;
  const employeeName = employee.name_en || employee.name_ar || 'Employee';
  const employerName = employer.name_en || employer.name_ar || 'Company';
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  switch (letterType) {
    case 'salary_certificate':
      return `This is to certify that ${employeeName} (Employee ID: ${employeeLink.employee_code || 'N/A'}) is currently employed with ${employerName} in the position of ${employeeLink.job_title || 'N/A'}.

Current Salary Details:
- Basic Salary: ${employeeLink.salary || 'N/A'} ${employeeLink.currency || 'OMR'}
- Employment Type: ${employeeLink.employment_type || 'N/A'}
- Employment Status: ${employeeLink.employment_status || 'N/A'}
- Hire Date: ${employeeLink.hire_date || 'N/A'}

This certificate is issued on ${today} for the purpose requested by the employee.

For ${employerName}
[Signature]
[Date: ${today}]`;

    case 'official':
      return `To Whom It May Concern,

This letter is to confirm that ${employeeName} (Employee ID: ${employeeLink.employee_code || 'N/A'}) is a bona fide employee of ${employerName}.

Employee Details:
- Name: ${employeeName}
- Position: ${employeeLink.job_title || 'N/A'}
- Department: ${employeeLink.department || 'N/A'}
- Employment Date: ${employeeLink.hire_date || 'N/A'}
- Employment Status: ${employeeLink.employment_status || 'N/A'}

${additionalData.message || 'This letter is issued for official purposes.'}

For ${employerName}
[Signature]
[Date: ${today}]`;

    case 'leave':
      const leaveType = additionalData.leave_type || 'Annual Leave';
      const leaveStart = additionalData.start_date || 'N/A';
      const leaveEnd = additionalData.end_date || 'N/A';
      return `LEAVE APPROVAL LETTER

To: ${employeeName}
Employee ID: ${employeeLink.employee_code || 'N/A'}
Position: ${employeeLink.job_title || 'N/A'}

This is to inform you that your ${leaveType} request has been approved.

Leave Details:
- Type: ${leaveType}
- Start Date: ${leaveStart}
- End Date: ${leaveEnd}
- Total Days: ${additionalData.total_days || 'N/A'}

You are expected to resume work on ${leaveEnd || 'the specified date'}.

For ${employerName}
[Signature]
[Date: ${today}]`;

    case 'employment':
      return `EMPLOYMENT CERTIFICATE

This is to certify that ${employeeName} (Employee ID: ${employeeLink.employee_code || 'N/A'}) has been employed with ${employerName} since ${employeeLink.hire_date || 'N/A'}.

Employment Details:
- Position: ${employeeLink.job_title || 'N/A'}
- Department: ${employeeLink.department || 'N/A'}
- Employment Type: ${employeeLink.employment_type || 'N/A'}
- Current Status: ${employeeLink.employment_status || 'N/A'}
- Work Location: ${employeeLink.work_location || 'N/A'}

This certificate is issued on ${today} at the request of the employee.

For ${employerName}
[Signature]
[Date: ${today}]`;

    case 'experience':
      return `EXPERIENCE CERTIFICATE

This is to certify that ${employeeName} (Employee ID: ${employeeLink.employee_code || 'N/A'}) worked with ${employerName} from ${employeeLink.hire_date || 'N/A'} to ${employeeLink.termination_date || 'Present'}.

During the tenure, ${employeeName} served as ${employeeLink.job_title || 'N/A'} in the ${employeeLink.department || 'N/A'} department.

${employeeName} has been a dedicated and hardworking employee, and we wish ${employeeName} all the best in future endeavors.

For ${employerName}
[Signature]
[Date: ${today}]`;

    case 'no_objection':
      return `NO OBJECTION CERTIFICATE

To Whom It May Concern,

This is to certify that we have no objection to ${employeeName} (Employee ID: ${employeeLink.employee_code || 'N/A'}) ${additionalData.purpose || 'pursuing the requested activity'}.

Employee Details:
- Name: ${employeeName}
- Position: ${employeeLink.job_title || 'N/A'}
- Department: ${employeeLink.department || 'N/A'}

This certificate is issued on ${today} and is valid for the purpose stated above.

For ${employerName}
[Signature]
[Date: ${today}]`;

    default:
      return `LETTER

To Whom It May Concern,

This letter is regarding ${employeeName} (Employee ID: ${employeeLink.employee_code || 'N/A'}), who is currently employed with ${employerName}.

${additionalData.message || 'Please find the details as requested.'}

For ${employerName}
[Signature]
[Date: ${today}]`;
  }
}

function generateLetterSubject(letterType: string, employeeLink: any): string {
  const employeeName =
    employeeLink.employee?.name_en ||
    employeeLink.employee?.name_ar ||
    'Employee';

  const subjects: Record<string, string> = {
    salary_certificate: `Salary Certificate - ${employeeName}`,
    official: `Official Letter - ${employeeName}`,
    leave: `Leave Approval Letter - ${employeeName}`,
    employment: `Employment Certificate - ${employeeName}`,
    experience: `Experience Certificate - ${employeeName}`,
    no_objection: `No Objection Certificate - ${employeeName}`,
  };

  return subjects[letterType] || `Letter - ${employeeName}`;
}
