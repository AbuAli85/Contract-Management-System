// supabase/functions/pdf-exporter/index.ts
// Self-contained PDF generation using Puppeteer

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

interface PDFExportRequest {
  contractId: string;
  contractType?: string;
  templateData: Record<string, any>;
  options?: {
    format?: 'A4' | 'Letter' | 'Legal';
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    includeBackground?: boolean;
    preferCSSPageSize?: boolean;
    printBackground?: boolean;
    landscape?: boolean;
  };
}

interface PDFExportResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
  processingTime: number;
  fileSize?: number;
}

serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const body: PDFExportRequest = await req.json();
    const { contractId, contractType, templateData, options = {} } = body;

    // Validate request
    if (!contractId || !templateData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Contract ID and template data are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔄 Starting PDF generation for contract:', contractId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate PDF
    const pdfResult = await generatePDF(contractId, templateData, options);

    if (!pdfResult.success) {
      return new Response(JSON.stringify(pdfResult), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upload PDF to Supabase Storage
    const uploadResult = await uploadPDFToStorage(
      supabase,
      contractId,
      pdfResult.pdfBuffer!
    );

    if (!uploadResult.success) {
      return new Response(JSON.stringify(uploadResult), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update contract with PDF URL
    await supabase
      .from('contracts')
      .update({
        pdf_url: uploadResult.pdfUrl,
        export_method: 'puppeteer',
        exported_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    // Log successful export
    await logPDFExport(supabase, {
      contractId,
      success: true,
      processingTime: Date.now() - startTime,
      fileSize: pdfResult.fileSize,
      exportMethod: 'puppeteer',
    });

    const result: PDFExportResult = {
      success: true,
      pdfUrl: uploadResult.pdfUrl,
      processingTime: Date.now() - startTime,
      fileSize: pdfResult.fileSize,
    };

    console.log('✅ PDF generation completed:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ PDF generation error:', error);

    const processingTime = Date.now() - startTime;

    // Log failed export
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await logPDFExport(supabase, {
        contractId: 'unknown',
        success: false,
        error: error.message,
        processingTime,
      });
    } catch (logError) {
      console.error('Failed to log PDF export:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        processingTime,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function generatePDF(
  contractId: string,
  templateData: Record<string, any>,
  options: any
): Promise<{
  success: boolean;
  pdfBuffer?: Uint8Array;
  error?: string;
  fileSize?: number;
}> {
  try {
    console.log('📄 Generating PDF with Puppeteer...');

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });

    // Generate HTML content
    const htmlContent = generateContractHTML(templateData, options);

    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Configure PDF options
    const pdfOptions = {
      format: options.format || 'A4',
      margin: {
        top: options.margin?.top || '20mm',
        right: options.margin?.right || '20mm',
        bottom: options.margin?.bottom || '20mm',
        left: options.margin?.left || '20mm',
      },
      printBackground: options.printBackground !== false,
      preferCSSPageSize: options.preferCSSPageSize !== false,
      landscape: options.landscape || false,
    };

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    await browser.close();

    console.log(
      '✅ PDF generated successfully, size:',
      pdfBuffer.length,
      'bytes'
    );

    return {
      success: true,
      pdfBuffer,
      fileSize: pdfBuffer.length,
    };
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function generateContractHTML(
  templateData: Record<string, any>,
  options: any
): string {
  const {
    contract_number,
    contract_date,
    first_party_name_en,
    first_party_name_ar,
    second_party_name_en,
    second_party_name_ar,
    promoter_name_en,
    promoter_name_ar,
    job_title,
    department,
    work_location,
    contract_start_date,
    contract_end_date,
    basic_salary,
    currency,
    special_terms,
  } = templateData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract - ${contract_number}</title>
    <style>
        @page {
            size: ${options.format || 'A4'};
            margin: ${options.margin?.top || '20mm'} ${options.margin?.right || '20mm'} ${options.margin?.bottom || '20mm'} ${options.margin?.left || '20mm'};
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        
        .contract-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .contract-number {
            font-size: 16px;
            color: #666;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        
        .party-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .party {
            width: 48%;
        }
        
        .party-name {
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .party-name-arabic {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            margin-bottom: 5px;
        }
        
        .field {
            margin-bottom: 8px;
        }
        
        .field-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        
        .field-value {
            display: inline-block;
        }
        
        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }
        
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 30px;
            padding-top: 5px;
            text-align: center;
            font-size: 12px;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="contract-title">EMPLOYMENT CONTRACT</div>
        <div class="contract-number">Contract Number: ${contract_number}</div>
        <div class="contract-date">Date: ${contract_date}</div>
    </div>

    <div class="section">
        <div class="section-title">PARTIES</div>
        <div class="party-info">
            <div class="party">
                <div class="party-name">First Party (Client)</div>
                <div class="party-name-arabic">${first_party_name_ar || ''}</div>
                <div class="field">
                    <span class="field-label">Name:</span>
                    <span class="field-value">${first_party_name_en || ''}</span>
                </div>
            </div>
            <div class="party">
                <div class="party-name">Second Party (Employer)</div>
                <div class="party-name-arabic">${second_party_name_ar || ''}</div>
                <div class="field">
                    <span class="field-label">Name:</span>
                    <span class="field-value">${second_party_name_en || ''}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">EMPLOYEE INFORMATION</div>
        <div class="field">
            <span class="field-label">Name:</span>
            <span class="field-value">${promoter_name_en || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Name (Arabic):</span>
            <span class="field-value">${promoter_name_ar || ''}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">CONTRACT DETAILS</div>
        <div class="field">
            <span class="field-label">Job Title:</span>
            <span class="field-value">${job_title || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Department:</span>
            <span class="field-value">${department || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Work Location:</span>
            <span class="field-value">${work_location || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Start Date:</span>
            <span class="field-value">${contract_start_date || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">End Date:</span>
            <span class="field-value">${contract_end_date || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Basic Salary:</span>
            <span class="field-value">${basic_salary || ''} ${currency || ''}</span>
        </div>
    </div>

    ${
      special_terms
        ? `
    <div class="section">
        <div class="section-title">SPECIAL TERMS</div>
        <div class="field-value">${special_terms}</div>
    </div>
    `
        : ''
    }

    <div class="signature-section">
        <div class="section-title">SIGNATURES</div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div style="width: 45%;">
                <div class="signature-line">First Party Signature</div>
            </div>
            <div style="width: 45%;">
                <div class="signature-line">Second Party Signature</div>
            </div>
        </div>
        
        <div style="text-align: center;">
            <div class="signature-line" style="width: 50%; margin: 0 auto;">Employee Signature</div>
        </div>
    </div>

    <div class="footer">
        <p>This contract was generated electronically on ${new Date().toLocaleDateString()}</p>
        <p>Contract Management System - All rights reserved</p>
    </div>
</body>
</html>
  `.trim();
}

async function uploadPDFToStorage(
  supabase: any,
  contractId: string,
  pdfBuffer: Uint8Array
): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    console.log('📤 Uploading PDF to Supabase Storage...');

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `contracts/${contractId}/contract_${timestamp}.pdf`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(filename);

    console.log('✅ PDF uploaded successfully:', urlData.publicUrl);

    return {
      success: true,
      pdfUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('❌ PDF upload failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function logPDFExport(supabase: any, data: any): Promise<void> {
  try {
    await supabase.from('contract_export_logs').insert({
      contract_id: data.contractId,
      success: data.success,
      export_method: data.exportMethod || 'puppeteer',
      error_message: data.error,
      processing_time_ms: data.processingTime,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log PDF export:', error);
  }
}
