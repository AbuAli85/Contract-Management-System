import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

// GET /api/work-permits/[id]/export - Export work permit application for Ministry submission
export const GET = withAnyRBAC(
  ['company:read:all', 'party:read:all', 'work_permit:read:all'],
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const supabase = await createClient();
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format') || 'json'; // json, csv, pdf

      // Get application with all related data
      const { data: application, error } = await supabase
        .from('work_permit_applications')
        .select(
          `
          *,
          employer:profiles!work_permit_applications_employer_id_fkey(
            id,
            email,
            full_name,
            phone
          ),
          employee:profiles!work_permit_applications_employee_id_fkey(
            id,
            email,
            full_name,
            phone,
            date_of_birth,
            gender
          ),
          employer_party:parties(
            id,
            name_en,
            name_ar,
            crn,
            contact_email,
            contact_phone,
            address_en,
            address_ar
          ),
          promoter:promoters(
            id,
            name_en,
            name_ar,
            email,
            phone,
            mobile_number,
            passport_number,
            id_card_number,
            nationality,
            date_of_birth,
            gender,
            address,
            city,
            country
          )
        `
        )
        .eq('id', id)
        .single();

      if (error || !application) {
        return NextResponse.json(
          { error: 'Work permit application not found' },
          { status: 404 }
        );
      }

      // Prepare data for Ministry submission format
      const ministryData = {
        // Application Information
        application_number: application.application_number,
        application_type: application.application_type,
        submission_date: new Date().toISOString().split('T')[0],

        // Employer Information
        employer: {
          name_en:
            application.employer_party?.name_en ||
            application.employer?.full_name,
          name_ar: application.employer_party?.name_ar,
          crn: application.employer_party?.crn,
          contact_email:
            application.employer_party?.contact_email ||
            application.employer?.email,
          contact_phone:
            application.employer_party?.contact_phone ||
            application.employer?.phone,
          address: application.employer_party?.address_en,
        },

        // Employee/Promoter Information
        employee: {
          name_en: application.employee_name_en,
          name_ar: application.employee_name_ar,
          national_id: application.national_id,
          passport_number:
            application.passport_number ||
            application.promoter?.passport_number,
          id_card_number: application.promoter?.id_card_number,
          nationality:
            application.nationality || application.promoter?.nationality,
          date_of_birth:
            application.promoter?.date_of_birth ||
            application.employee?.date_of_birth,
          gender: application.promoter?.gender || application.employee?.gender,
          email: application.promoter?.email || application.employee?.email,
          phone:
            application.promoter?.mobile_number ||
            application.promoter?.phone ||
            application.employee?.phone,
          address: application.promoter?.address,
          city: application.promoter?.city,
          country: application.promoter?.country,
        },

        // Employment Details
        employment: {
          job_title: application.job_title,
          department: application.department,
          employment_type: application.employment_type,
          work_permit_category: application.work_permit_category,
          salary: application.salary,
          currency: application.currency,
          start_date: application.work_permit_start_date,
          end_date: application.work_permit_end_date,
        },

        // Documents
        documents: {
          required: application.required_documents || [],
          submitted: application.submitted_documents || [],
          urls: application.document_urls || {},
        },

        // Additional Information
        notes: application.internal_notes,
      };

      if (format === 'json') {
        return NextResponse.json(
          {
            success: true,
            data: ministryData,
            message: 'Application data prepared for Ministry submission',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="work-permit-${application.application_number}-ministry-data.json"`,
            },
          }
        );
      }

      if (format === 'csv') {
        // Convert to CSV format
        const csvRows = [
          ['Field', 'Value'],
          ['Application Number', ministryData.application_number],
          ['Application Type', ministryData.application_type],
          ['Submission Date', ministryData.submission_date],
          ['', ''],
          ['EMPLOYER INFORMATION', ''],
          ['Employer Name (EN)', ministryData.employer.name_en],
          ['Employer Name (AR)', ministryData.employer.name_ar || ''],
          ['CRN', ministryData.employer.crn || ''],
          ['Contact Email', ministryData.employer.contact_email],
          ['Contact Phone', ministryData.employer.contact_phone],
          ['Address', ministryData.employer.address || ''],
          ['', ''],
          ['EMPLOYEE INFORMATION', ''],
          ['Employee Name (EN)', ministryData.employee.name_en],
          ['Employee Name (AR)', ministryData.employee.name_ar || ''],
          ['National ID', ministryData.employee.national_id || ''],
          ['Passport Number', ministryData.employee.passport_number || ''],
          ['ID Card Number', ministryData.employee.id_card_number || ''],
          ['Nationality', ministryData.employee.nationality || ''],
          ['Date of Birth', ministryData.employee.date_of_birth || ''],
          ['Gender', ministryData.employee.gender || ''],
          ['Email', ministryData.employee.email || ''],
          ['Phone', ministryData.employee.phone || ''],
          ['Address', ministryData.employee.address || ''],
          ['City', ministryData.employee.city || ''],
          ['Country', ministryData.employee.country || ''],
          ['', ''],
          ['EMPLOYMENT DETAILS', ''],
          ['Job Title', ministryData.employment.job_title],
          ['Department', ministryData.employment.department || ''],
          ['Employment Type', ministryData.employment.employment_type || ''],
          [
            'Work Permit Category',
            ministryData.employment.work_permit_category || '',
          ],
          ['Salary', ministryData.employment.salary?.toString() || ''],
          ['Currency', ministryData.employment.currency],
          ['Start Date', ministryData.employment.start_date || ''],
          ['End Date', ministryData.employment.end_date || ''],
          ['', ''],
          ['DOCUMENTS', ''],
          [
            'Required Documents',
            (ministryData.documents.required || []).join('; '),
          ],
          [
            'Submitted Documents',
            (ministryData.documents.submitted || []).join('; '),
          ],
          ['', ''],
          ['NOTES', ''],
          ['Internal Notes', ministryData.notes || ''],
        ];

        const csvContent = csvRows
          .map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          )
          .join('\n');

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="work-permit-${application.application_number}-ministry-data.csv"`,
          },
        });
      }

      // PDF format would require a PDF generation library
      return NextResponse.json(
        { error: 'PDF format not yet implemented. Use JSON or CSV format.' },
        { status: 400 }
      );
    } catch (error: any) {
      console.error('Error exporting work permit application:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
