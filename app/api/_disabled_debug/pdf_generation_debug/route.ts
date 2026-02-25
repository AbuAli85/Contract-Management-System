import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint for PDF generation without authentication
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();


    // Generate actual PDF content using HTML template
    const pdfBuffer = await generateContractPDF(
      body,
      body.contractNumber || 'DEBUG-001'
    );

    // For debug purposes, return the PDF content as base64
    const pdfBase64 = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      pdf_base64: pdfBase64,
      pdf_size: pdfBuffer.length,
      contract_data: body,
      message: 'PDF generated successfully (debug mode)',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}

// Function to generate actual PDF content using HTML template
async function generateContractPDF(
  contract: any,
  contractNumber: string
): Promise<Buffer> {
  // Create HTML content for the contract
  const _htmlContent = `    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Employment Contract - ${contractNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .contract-number {
          font-size: 18px;
          font-weight: bold;
          margin: 10px 0;
        }
        .section {
          margin: 20px 0;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        .field {
          margin: 8px 0;
        }
        .field-label {
          font-weight: bold;
          display: inline-block;
          width: 150px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>EMPLOYMENT CONTRACT</h1>
        <div class="contract-number">Contract Number: ${contractNumber}</div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
      </div>

      <div class="section">
        <div class="section-title">CONTRACT DETAILS</div>
        <div class="field">
          <span class="field-label">Contract ID:</span>
          <span>${contract.contractId || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Job Title:</span>
          <span>${contract.job_title || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Department:</span>
          <span>${contract.department || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Work Location:</span>
          <span>${contract.work_location || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">CONTRACT TERMS</div>
        <div class="field">
          <span class="field-label">Contract Type:</span>
          <span>${contract.contract_type || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Start Date:</span>
          <span>${contract.contract_start_date || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">End Date:</span>
          <span>${contract.contract_end_date || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">COMPENSATION</div>
        <div class="field">
          <span class="field-label">Basic Salary:</span>
          <span>${contract.basic_salary || 'N/A'} ${contract.currency || 'SAR'}</span>
        </div>
        <div class="field">
          <span class="field-label">Allowances:</span>
          <span>${contract.allowances || 'N/A'} ${contract.currency || 'SAR'}</span>
        </div>
      </div>

      <div class="footer">
        <p>This contract is generated electronically and is legally binding.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  // For now, we'll create a simple text-based PDF-like content
  // In a real implementation, you would use a library like puppeteer to convert HTML to PDF
  const textContent = `
EMPLOYMENT CONTRACT

Contract Number: ${contractNumber}
Date: ${new Date().toLocaleDateString()}

CONTRACT DETAILS
Contract ID: ${contract.contractId || 'N/A'}
Job Title: ${contract.job_title || 'N/A'}
Department: ${contract.department || 'N/A'}
Work Location: ${contract.work_location || 'N/A'}

CONTRACT TERMS
Contract Type: ${contract.contract_type || 'N/A'}
Start Date: ${contract.contract_start_date || 'N/A'}
End Date: ${contract.contract_end_date || 'N/A'}

COMPENSATION
Basic Salary: ${contract.basic_salary || 'N/A'} ${contract.currency || 'SAR'}
Allowances: ${contract.allowances || 'N/A'} ${contract.currency || 'SAR'}

This contract is generated electronically and is legally binding.
Generated on: ${new Date().toLocaleString()}
  `;

  // Convert text content to Buffer (simulating PDF content)
  // In a real implementation, this would be actual PDF binary data
  return Buffer.from(textContent, 'utf-8');
}
