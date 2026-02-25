import type { ContractData } from './google-docs-service';

export interface HtmlContractConfig {
  templatePath: string;
  outputPath: string;
}

export class HtmlContractService {
  private config: HtmlContractConfig;

  constructor(config: HtmlContractConfig) {
    this.config = config;
  }

  /**
   * Generate contract from HTML template
   */
  async generateContract(contractData: ContractData): Promise<{
    htmlContent: string;
    pdfBuffer: Buffer;
    documentUrl: string;
  }> {
    try {
      // Step 1: Generate HTML content
      const htmlContent = await this.generateHtmlContent(contractData);

      // Step 2: Generate PDF from HTML
      const pdfBuffer = await this.generatePdfFromHtml(htmlContent);

      // Step 3: Save files
      const documentUrl = await this.saveContract(
        htmlContent,
        pdfBuffer,
        contractData
      );

      return {
        htmlContent,
        pdfBuffer,
        documentUrl,
      };
    } catch (error) {
      console.error('❌ HTML contract generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content from template
   */
  private async generateHtmlContent(data: ContractData): Promise<string> {
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract ${data.contract_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .contract-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .arabic {
            direction: rtl;
            text-align: right;
            font-family: 'Arial', sans-serif;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        .party-info {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 10px;
        }
        .image-placeholder {
            border: 2px dashed #ccc;
            padding: 20px;
            text-align: center;
            margin: 10px 0;
            background-color: #f9f9f9;
        }
        .contract-details {
            background-color: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="contract-title">Promoter Assignment Contract</div>
        <div class="arabic">عقد عمل بائع</div>
        <div>Ref: ${data.contract_number}</div>
        <div>Date: ${data.contract_date}</div>
    </div>

    <div class="section">
        <div class="section-title">Contract Parties</div>
        
        <div class="party-info">
            <h4>First Party (Client) - الطرف الأول</h4>
            <div class="arabic">${data.first_party_name_ar} (الشركة)</div>
            <div>${data.first_party_name_en}</div>
            <div>Commercial Registration: ${data.first_party_crn}</div>
            <div>Email: ${data.first_party_email}</div>
            <div>Phone: ${data.first_party_phone}</div>
        </div>

        <div class="party-info">
            <h4>Second Party (Employer) - الطرف الثاني</h4>
            <div class="arabic">${data.second_party_name_ar}</div>
            <div>${data.second_party_name_en}</div>
            <div>Commercial Registration: ${data.second_party_crn}</div>
            <div>Email: ${data.second_party_email}</div>
            <div>Phone: ${data.second_party_phone}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Promoter Details - تفاصيل الموظف</div>
        
        <div class="party-info">
            <h4>Promoter Information</h4>
            <div class="arabic">الفاضل: ${data.promoter_name_ar} (الموظف)</div>
            <div>Name: ${data.promoter_name_en}</div>
            <div>ID Card Number: ${data.promoter_id_card_number}</div>
            <div>Mobile: ${data.promoter_mobile_number}</div>
            <div>Email: ${data.promoter_email}</div>
        </div>

        <div class="image-placeholder">
            <h4>ID Card Image</h4>
            <p>ID Card image will be inserted here</p>
            ${data.promoter_id_card_url ? `<img src="${data.promoter_id_card_url}" alt="ID Card" style="max-width: 300px; max-height: 200px;">` : ''}
        </div>

        <div class="image-placeholder">
            <h4>Passport Image</h4>
            <p>Passport image will be inserted here</p>
            ${data.promoter_passport_url ? `<img src="${data.promoter_passport_url}" alt="Passport" style="max-width: 300px; max-height: 200px;">` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Contract Terms - شروط العقد</div>
        
        <div class="contract-details">
            <h4>Assignment Period</h4>
            <div class="arabic">تاريخ الالتحاق: ${data.contract_start_date} وحتى ${data.contract_end_date}</div>
            <div>From: ${data.contract_start_date} To: ${data.contract_end_date}</div>
        </div>

        <div class="contract-details">
            <h4>Job Details</h4>
            <div>Position: ${data.job_title}</div>
            <div>Department: ${data.department}</div>
            <div>Work Location: ${data.work_location}</div>
            <div>Basic Salary: ${data.basic_salary} ${data.currency}</div>
        </div>

        ${
          data.special_terms
            ? `
        <div class="contract-details">
            <h4>Special Terms</h4>
            <div>${data.special_terms}</div>
        </div>
        `
            : ''
        }
    </div>

    <div class="section">
        <div class="section-title">Responsibilities - المسؤوليات</div>
        <div class="arabic">
            يتحمل المسؤولية الطرف الثاني الأمور المالية والإدارية عن الموظف.
        </div>
        <div>
            Party 2 will bear the entire financial and administrative responsibilities toward this promoter.
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="arabic">ولكم التحية والتقدير،</div>
            <div>Best Regards</div>
            <br><br>
            <div>For United Electronics Company - eXtra</div>
        </div>
        
        <div class="signature-box">
            <div>Signed and agreed for Party 2</div>
            <div class="arabic">موافق عليه للطرف الثاني</div>
            <br><br>
            <div>_________________________</div>
            <div>Signature</div>
        </div>
    </div>
</body>
</html>`;

    return template;
  }

  /**
   * Generate PDF from HTML using Puppeteer
   */
  private async generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    try {
      // This would use Puppeteer in a real implementation
      // For now, we'll return a placeholder

      // In a real implementation, you would:
      // 1. Use Puppeteer to render HTML
      // 2. Generate PDF
      // 3. Return PDF buffer

      // For now, return a simple text-based PDF placeholder
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Contract Generated Successfully) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

      return Buffer.from(pdfContent);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  }

  /**
   * Save contract files
   */
  private async saveContract(
    htmlContent: string,
    pdfBuffer: Buffer,
    data: ContractData
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `Contract-${data.contract_number}-${timestamp}`;

      // In a real implementation, you would save to:
      // 1. Local file system
      // 2. Cloud storage (AWS S3, Google Cloud Storage, etc.)
      // 3. Database

      // For now, return a placeholder URL
      return `https://your-domain.com/contracts/${fileName}.pdf`;
    } catch (error) {
      console.error('Failed to save contract:', error);
      throw error;
    }
  }
}
