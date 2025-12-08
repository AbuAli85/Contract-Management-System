import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const DocumentGenerationSchema = z.object({
  employee_id: z.number(),
  template_key: z.string(),
  additional_data: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const parsed = DocumentGenerationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { employee_id, template_key, additional_data = {} } = parsed.data;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to generate documents
    const { data: userProfile } = await supabase
      .from('hr.user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userProfile || !['hr_admin', 'hr_staff'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 1) Fetch employee data
    const { data: employee, error: empError } = await supabase
      .from('hr.employees')
      .select(
        `
        id, employee_code, full_name, first_name, last_name, 
        nationality, gender, date_of_birth, job_title, 
        department_id, phone, email, personal_email, 
        address, city, country, employment_status, 
        hire_date, salary, currency, work_location,
        departments!inner(name)
      `
      )
      .eq('id', employee_id)
      .single();

    if (empError || !employee) {
      console.error('Error fetching employee:', empError);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // 2) Fetch template
    const { data: template, error: templateError } = await supabase
      .from('hr.doc_templates')
      .select('*')
      .eq('key', template_key)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Error fetching template:', templateError);
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // 3) Load template content from storage
    const { data: templateFile, error: fileError } = await supabase.storage
      .from('hr-templates')
      .download(template.storage_path);

    if (fileError || !templateFile) {
      console.error('Error downloading template:', fileError);
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 404 }
      );
    }

    const templateContent = await templateFile.text();

    // 4) Prepare data for template rendering
    const templateData = {
      employee: {
        ...employee,
        department_name: Array.isArray(employee.departments)
          ? employee.departments[0]?.name
          : (employee.departments as any)?.name,
        current_date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        formatted_hire_date: employee.hire_date
          ? new Date(employee.hire_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '',
        formatted_salary: employee.salary
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: employee.currency || 'USD',
            }).format(employee.salary)
          : '',
      },
      company: {
        name: 'Your Company Name', // This should come from company settings
        address: 'Company Address',
        phone: 'Company Phone',
        email: 'Company Email',
      },
      ...additional_data,
    };

    // 5) Render template (simple string replacement for now)
    // In production, you would use a proper templating engine like Handlebars
    let renderedContent = templateContent;

    // Replace placeholders with actual data
    Object.entries(templateData.employee).forEach(([key, value]) => {
      const placeholder = `{{employee.${key}}}`;
      renderedContent = renderedContent.replace(
        new RegExp(placeholder, 'g'),
        String(value || '')
      );
    });

    Object.entries(templateData.company).forEach(([key, value]) => {
      const placeholder = `{{company.${key}}}`;
      renderedContent = renderedContent.replace(
        new RegExp(placeholder, 'g'),
        String(value || '')
      );
    });

    // Replace additional data
    Object.entries(additional_data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      renderedContent = renderedContent.replace(
        new RegExp(placeholder, 'g'),
        String(value || '')
      );
    });

    // 6) Generate PDF (simplified - in production use puppeteer or similar)
    // For now, we'll store the HTML content and return a placeholder
    const fileName = `${template_key}_${employee.employee_code}_${Date.now()}.html`;
    const storagePath = `employee-docs/${employee_id}/generated/${fileName}`;

    // Upload the rendered content to storage
    const { error: uploadError } = await supabase.storage
      .from('employee-docs')
      .upload(storagePath, renderedContent, {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading generated document:', uploadError);
      return NextResponse.json(
        { error: 'Failed to save generated document' },
        { status: 500 }
      );
    }

    // 7) Record the generation in database
    const { data: generatedDoc, error: recordError } = await supabase
      .from('hr.generated_docs')
      .insert({
        employee_id,
        template_id: template.id,
        output_storage_path: storagePath,
        generated_by: user.id,
        generation_data: templateData,
        status: 'generated',
      })
      .select(
        `
        id, employee_id, template_id, output_storage_path, 
        generated_by, generation_data, status, created_at
      `
      )
      .single();

    if (recordError) {
      console.error('Error recording generated document:', recordError);
      return NextResponse.json(
        { error: 'Failed to record document generation' },
        { status: 500 }
      );
    }

    // 8) Get public URL for the generated document
    const { data: urlData } = supabase.storage
      .from('employee-docs')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      message: 'Document generated successfully',
      data: {
        ...generatedDoc,
        download_url: urlData.publicUrl,
        file_name: fileName,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/hr/documents/generate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
