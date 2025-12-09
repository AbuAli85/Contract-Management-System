import { jsPDF } from 'jspdf';

interface ProfessionalContractData {
  contract_number: string;
  contract_type: string;

  // Employer (First Party)
  employer_name_en: string;
  employer_name_ar?: string;
  employer_crn?: string;
  employer_address?: string;
  employer_contact?: string;
  employer_phone?: string;
  employer_logo?: string;

  // Employee/Promoter
  employee_name_en: string;
  employee_name_ar?: string;
  employee_id_number: string;
  employee_phone?: string;
  employee_email?: string;
  employee_nationality?: string;

  // Job Details
  job_title: string;
  department?: string;
  work_location?: string;

  // Contract Terms
  start_date: string;
  end_date: string;
  basic_salary: number;
  allowances?: number;
  currency: string;
  working_hours?: string;
  probation_period?: string;

  // Additional Terms
  special_terms?: string;
  benefits?: string[];

  // Client (Second Party)
  client_name?: string;
  client_contact?: string;
}

export async function generateProfessionalContractPDF(
  data: ProfessionalContractData
): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color scheme
  const primaryColor: [number, number, number] = [26, 54, 126]; // Dark blue
  const secondaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const accentColor: [number, number, number] = [16, 185, 129]; // Green

  let yPos = 15;

  // ========================================
  // HEADER SECTION
  // ========================================

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Company logo (if available)
  // TODO: Add logo image support

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYMENT CONTRACT', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contract Type: ${data.contract_type}`, pageWidth / 2, 27, {
    align: 'center',
  });

  yPos = 45;

  // ========================================
  // CONTRACT NUMBER & DATE SECTION
  // ========================================

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Contract number box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(15, yPos, 85, 12, 2, 2, 'F');
  doc.text(`Contract No: ${data.contract_number}`, 17, yPos + 8);

  // Date box
  doc.roundedRect(pageWidth - 100, yPos, 85, 12, 2, 2, 'F');
  doc.text(
    `Date: ${new Date().toLocaleDateString()}`,
    pageWidth - 98,
    yPos + 8
  );

  yPos += 25;

  // ========================================
  // SECTION: PARTIES
  // ========================================

  // Section header
  doc.setFillColor(...secondaryColor);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PARTIES TO THE CONTRACT', 17, yPos + 6);

  yPos += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Employer (First Party)
  doc.setFont('helvetica', 'bold');
  doc.text('THE EMPLOYER (First Party):', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  const employerDetails = [
    `Company Name: ${data.employer_name_en}`,
    data.employer_name_ar ? `الاسم بالعربية: ${data.employer_name_ar}` : null,
    data.employer_crn ? `Commercial Registration: ${data.employer_crn}` : null,
    data.employer_address ? `Address: ${data.employer_address}` : null,
    data.employer_contact ? `Contact Person: ${data.employer_contact}` : null,
    data.employer_phone ? `Phone: ${data.employer_phone}` : null,
  ].filter(Boolean) as string[];

  employerDetails.forEach(detail => {
    doc.text(detail, 25, yPos);
    yPos += 5;
  });

  yPos += 5;

  // Employee (Second Party)
  doc.setFont('helvetica', 'bold');
  doc.text('THE EMPLOYEE (Second Party):', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  const employeeDetails = [
    `Full Name: ${data.employee_name_en}`,
    data.employee_name_ar ? `الاسم بالعربية: ${data.employee_name_ar}` : null,
    `ID Number: ${data.employee_id_number}`,
    data.employee_nationality
      ? `Nationality: ${data.employee_nationality}`
      : null,
    data.employee_phone ? `Mobile: ${data.employee_phone}` : null,
    data.employee_email ? `Email: ${data.employee_email}` : null,
  ].filter(Boolean) as string[];

  employeeDetails.forEach(detail => {
    doc.text(detail, 25, yPos);
    yPos += 5;
  });

  yPos += 10;

  // ========================================
  // SECTION: POSITION & DUTIES
  // ========================================

  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(...secondaryColor);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('2. POSITION AND DUTIES', 17, yPos + 6);

  yPos += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const jobDetails = [
    `Job Title: ${data.job_title}`,
    data.department ? `Department: ${data.department}` : null,
    data.work_location ? `Work Location: ${data.work_location}` : null,
    data.working_hours ? `Working Hours: ${data.working_hours}` : null,
  ].filter(Boolean) as string[];

  jobDetails.forEach(detail => {
    doc.text(detail, 20, yPos);
    yPos += 6;
  });

  yPos += 10;

  // ========================================
  // SECTION: CONTRACT PERIOD
  // ========================================

  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(...secondaryColor);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('3. CONTRACT PERIOD', 17, yPos + 6);

  yPos += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  // Create a nice date box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Contract Start Date:', 25, yPos + 8);
  doc.text('Contract End Date:', 25, yPos + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(
    new Date(data.start_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    100,
    yPos + 8
  );
  doc.text(
    new Date(data.end_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    100,
    yPos + 18
  );

  yPos += 30;

  if (data.probation_period) {
    doc.text(`Probation Period: ${data.probation_period}`, 25, yPos);
    yPos += 6;
  }

  yPos += 10;

  // ========================================
  // SECTION: COMPENSATION
  // ========================================

  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(...secondaryColor);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('4. COMPENSATION AND BENEFITS', 17, yPos + 6);

  yPos += 15;
  doc.setTextColor(0, 0, 0);

  // Salary table
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Monthly Compensation Breakdown:', 25, yPos + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const basicSalaryStr = `${data.basic_salary.toLocaleString()} ${data.currency}`;
  const allowancesStr = data.allowances
    ? `${data.allowances.toLocaleString()} ${data.currency}`
    : 'N/A';
  const totalStr = `${(data.basic_salary + (data.allowances || 0)).toLocaleString()} ${data.currency}`;

  doc.text('Basic Salary:', 25, yPos + 15);
  doc.text('Allowances:', 25, yPos + 22);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 25, yPos + 29);

  doc.setFont('helvetica', 'normal');
  doc.text(basicSalaryStr, pageWidth - 60, yPos + 15, { align: 'right' });
  doc.text(allowancesStr, pageWidth - 60, yPos + 22, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...accentColor);
  doc.text(totalStr, pageWidth - 60, yPos + 29, { align: 'right' });

  yPos += 45;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Benefits
  if (data.benefits && data.benefits.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Benefits:', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    data.benefits.forEach(benefit => {
      doc.text(`• ${benefit}`, 25, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // ========================================
  // SECTION: SPECIAL TERMS
  // ========================================

  if (data.special_terms) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...secondaryColor);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('5. SPECIAL TERMS AND CONDITIONS', 17, yPos + 6);

    yPos += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const specialTermsLines = doc.splitTextToSize(
      data.special_terms,
      pageWidth - 50
    );
    specialTermsLines.forEach((line: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 6;
    });

    yPos += 10;
  }

  // ========================================
  // SECTION: GENERAL TERMS
  // ========================================

  if (yPos > 180) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(...secondaryColor);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const sectionNumber = data.special_terms ? 6 : 5;
  doc.text(`${sectionNumber}. GENERAL TERMS AND CONDITIONS`, 17, yPos + 6);

  yPos += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const generalTerms = [
    'The employee shall perform their duties with utmost good faith and diligence.',
    'The employee shall comply with all company policies, procedures, and regulations.',
    'Either party may terminate this contract with 30 days written notice, unless otherwise specified.',
    'This contract is governed by the labor laws of the Sultanate of Oman.',
    'Any modifications to this contract must be made in writing and signed by both parties.',
    'Confidential information must not be disclosed during or after employment.',
  ];

  generalTerms.forEach((term, index) => {
    if (yPos > 265) {
      doc.addPage();
      yPos = 20;
    }
    const lines = doc.splitTextToSize(`${index + 1}. ${term}`, pageWidth - 50);
    lines.forEach((line: string) => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    yPos += 3;
  });

  // ========================================
  // SIGNATURE SECTION
  // ========================================

  yPos += 15;
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', 17, yPos + 6);

  yPos += 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Signature boxes
  const boxWidth = (pageWidth - 45) / 2;

  // Employer signature
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, yPos, boxWidth, 30, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.text('Employer:', 20, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.employer_name_en, 20, yPos + 14);
  doc.line(20, yPos + 22, 15 + boxWidth - 5, yPos + 22);
  doc.setFontSize(9);
  doc.text('Signature & Date', 20, yPos + 27);

  // Employee signature
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth - 15 - boxWidth, yPos, boxWidth, 30, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Employee:', pageWidth - 10 - boxWidth, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.employee_name_en, pageWidth - 10 - boxWidth, yPos + 14);
  doc.line(pageWidth - 10 - boxWidth, yPos + 22, pageWidth - 20, yPos + 22);
  doc.setFontSize(9);
  doc.text('Signature & Date', pageWidth - 10 - boxWidth, yPos + 27);

  // ========================================
  // FOOTER
  // ========================================

  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Contract ${data.contract_number} | Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  };

  // Add footers to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
