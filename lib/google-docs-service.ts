import { google } from 'googleapis';

export interface GoogleDocsConfig {
  templateId: string;
  serviceAccountKey: string;
  outputFolderId?: string | undefined;
}

export interface ContractData {
  // Contract info
  contract_id: string;
  contract_number: string;
  contract_type: string;
  contract_date: string;
  
  // Promoter data
  promoter_name_en: string;
  promoter_name_ar: string;
  promoter_email: string;
  promoter_mobile_number: string;
  promoter_id_card_number: string;
  promoter_passport_number?: string;
  promoter_id_card_url?: string;
  promoter_passport_url?: string;
  
  // First party (Client) data
  first_party_name_en: string;
  first_party_name_ar: string;
  first_party_crn: string;
  first_party_email: string;
  first_party_phone: string;
  
  // Second party (Employer) data
  second_party_name_en: string;
  second_party_name_ar: string;
  second_party_crn: string;
  second_party_email: string;
  second_party_phone: string;
  
  // Contract details
  job_title: string;
  department: string;
  work_location: string;
  basic_salary: number;
  contract_start_date: string;
  contract_end_date: string;
  special_terms: string;
  currency: string;
}

export class GoogleDocsService {
  private auth: any;
  private docs: any;
  private drive: any;
  private config: GoogleDocsConfig;

  constructor(config: GoogleDocsConfig) {
    this.config = config;
  }

  private async ensureInitialized() {
    if (!this.docs || !this.drive) {
      await this.initializeAuth();
    }
  }

  private async initializeAuth() {
    try {
      const serviceAccountKey = JSON.parse(this.config.serviceAccountKey);
      
      this.auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: [
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      // Get authenticated client
      const authClient = await this.auth.getClient();
      
      this.docs = google.docs({ version: 'v1', auth: authClient });
      this.drive = google.drive({ version: 'v3', auth: authClient });
      
      console.log('✅ Google APIs initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Auth:', error);
      throw new Error(`Invalid Google Service Account configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate contract from template with data replacement
   */
  async generateContract(contractData: ContractData): Promise<{
    documentId: string;
    documentUrl: string;
    pdfUrl: string;
  }> {
    try {
      console.log('🔄 Starting Google Docs contract generation...');

      // Ensure Google APIs are initialized
      await this.ensureInitialized();

      // Step 1: Copy template to create new document
      const documentId = await this.copyTemplate();
      console.log('✅ Template copied, document ID:', documentId);

      // Step 2: Replace text placeholders
      await this.replaceTextPlaceholders(documentId, contractData);
      console.log('✅ Text placeholders replaced');

      // Step 3: Replace image placeholders
      await this.replaceImagePlaceholders(documentId, contractData);
      console.log('✅ Image placeholders replaced');

      // Step 4: Generate PDF
      const pdfUrl = await this.generatePDF(documentId);
      console.log('✅ PDF generated');

      const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

      return {
        documentId,
        documentUrl,
        pdfUrl
      };
    } catch (error) {
      console.error('❌ Google Docs generation failed:', error);
      throw error;
    }
  }

  /**
   * Copy template to create new document
   */
  private async copyTemplate(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `Contract-${timestamp}`;

      console.log(`📋 Copying template ${this.config.templateId} to ${fileName}`);

      const response = await this.drive.files.copy({
        fileId: this.config.templateId,
        requestBody: {
          name: fileName,
          parents: this.config.outputFolderId ? [this.config.outputFolderId] : undefined
        }
      });

      if (!response.data.id) {
        throw new Error('Failed to copy template - no document ID returned');
      }

      console.log('✅ Template copied successfully:', response.data.id);
      return response.data.id;
    } catch (error) {
      console.error('❌ Failed to copy template:', error);
      throw new Error(`Template copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Replace text placeholders in the document
   */
  private async replaceTextPlaceholders(documentId: string, data: ContractData) {
    const requests = [];

    // Define all placeholder mappings
    const placeholders = {
      '{{contract_number}}': data.contract_number,
      '{{contract_date}}': data.contract_date,
      '{{contract_type}}': data.contract_type,
      
      // Promoter data
      '{{promoter_name_en}}': data.promoter_name_en,
      '{{promoter_name_ar}}': data.promoter_name_ar,
      '{{promoter_email}}': data.promoter_email,
      '{{promoter_mobile_number}}': data.promoter_mobile_number,
      '{{promoter_id_card_number}}': data.promoter_id_card_number,
      '{{promoter_passport_number}}': data.promoter_passport_number || '',
      
      // First party (Client) data
      '{{first_party_name_en}}': data.first_party_name_en,
      '{{first_party_name_ar}}': data.first_party_name_ar,
      '{{first_party_crn}}': data.first_party_crn,
      '{{first_party_email}}': data.first_party_email,
      '{{first_party_phone}}': data.first_party_phone,
      
      // Second party (Employer) data
      '{{second_party_name_en}}': data.second_party_name_en,
      '{{second_party_name_ar}}': data.second_party_name_ar,
      '{{second_party_crn}}': data.second_party_crn,
      '{{second_party_email}}': data.second_party_email,
      '{{second_party_phone}}': data.second_party_phone,
      
      // Contract details
      '{{job_title}}': data.job_title,
      '{{department}}': data.department,
      '{{work_location}}': data.work_location,
      '{{basic_salary}}': data.basic_salary.toString(),
      '{{contract_start_date}}': data.contract_start_date,
      '{{contract_end_date}}': data.contract_end_date,
      '{{special_terms}}': data.special_terms,
      '{{currency}}': data.currency,
    };

    // Create replace text requests for each placeholder
    for (const [placeholder, value] of Object.entries(placeholders)) {
      requests.push({
        replaceAllText: {
          containsText: {
            text: placeholder,
            matchCase: false
          },
          replaceText: value
        }
      });
    }

    // Execute all replacement requests
    if (requests.length > 0) {
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests
        }
      });
    }
  }

  /**
   * Replace image placeholders with actual images
   */
  private async replaceImagePlaceholders(documentId: string, data: ContractData) {
    const requests = [];

    // Handle ID card image replacement
    if (data.promoter_id_card_url) {
      try {
        const imageRequest = await this.createImageReplacementRequest(
          documentId,
          '{{promoter_id_card_image}}',
          data.promoter_id_card_url,
          'ID Card'
        );
        if (imageRequest) {
          requests.push(imageRequest);
        }
      } catch (error) {
        console.warn('Failed to replace ID card image:', error);
      }
    }

    // Handle passport image replacement
    if (data.promoter_passport_url) {
      try {
        const imageRequest = await this.createImageReplacementRequest(
          documentId,
          '{{promoter_passport_image}}',
          data.promoter_passport_url,
          'Passport'
        );
        if (imageRequest) {
          requests.push(imageRequest);
        }
      } catch (error) {
        console.warn('Failed to replace passport image:', error);
      }
    }

    // Execute image replacement requests
    if (requests.length > 0) {
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests
        }
      });
    }
  }

  /**
   * Create image replacement request
   */
  private async createImageReplacementRequest(
    documentId: string,
    placeholder: string,
    imageUrl: string,
    altText: string
  ) {
    try {
      // First, get the document to find the placeholder
      const doc = await this.docs.documents.get({ documentId });
      
      // Find the placeholder text
      let placeholderIndex = -1;
      let placeholderStart = -1;
      let placeholderEnd = -1;

      for (const element of doc.data.body?.content || []) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun?.content?.includes(placeholder)) {
              placeholderIndex = element.startIndex || 0;
              placeholderStart = textElement.startIndex || 0;
              placeholderEnd = (textElement.endIndex || 0) - 1;
              break;
            }
          }
        }
        if (placeholderIndex !== -1) break;
      }

      if (placeholderIndex === -1) {
        console.warn(`Placeholder ${placeholder} not found in document`);
        return null;
      }

      // Download and upload image to Drive
      const imageId = await this.uploadImageToDrive(imageUrl, altText);

      // Create image replacement request
      return {
        insertInlineImage: {
          location: {
            index: placeholderStart
          },
          uri: `https://drive.google.com/uc?id=${imageId}`,
          objectSize: {
            height: {
              magnitude: 200,
              unit: 'PT'
            },
            width: {
              magnitude: 300,
              unit: 'PT'
            }
          }
        }
      };
    } catch (error) {
      console.error(`Failed to create image replacement for ${placeholder}:`, error);
      return null;
    }
  }

  /**
   * Upload image to Google Drive
   */
  private async uploadImageToDrive(imageUrl: string, fileName: string): Promise<string> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      // Upload to Drive
      const uploadResponse = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: this.config.outputFolderId ? [this.config.outputFolderId] : undefined
        },
        media: {
          mimeType: 'image/jpeg',
          body: Buffer.from(imageBuffer)
        }
      });

      return uploadResponse.data.id;
    } catch (error) {
      console.error('Failed to upload image to Drive:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from document
   */
  private async generatePDF(documentId: string): Promise<string> {
    try {
      const response = await this.drive.files.export({
        fileId: documentId,
        mimeType: 'application/pdf'
      }, {
        responseType: 'arraybuffer'
      });

      // Upload PDF to Drive
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pdfFileName = `Contract-${timestamp}.pdf`;

      const pdfUploadResponse = await this.drive.files.create({
        requestBody: {
          name: pdfFileName,
          parents: this.config.outputFolderId ? [this.config.outputFolderId] : undefined
        },
        media: {
          mimeType: 'application/pdf',
          body: Buffer.from(response.data as ArrayBuffer)
        }
      });

      // Make PDF publicly accessible
      await this.drive.permissions.create({
        fileId: pdfUploadResponse.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return `https://drive.google.com/file/d/${pdfUploadResponse.data.id}/view`;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  }

  /**
   * Get document content for debugging
   */
  async getDocumentContent(documentId: string) {
    try {
      const response = await this.docs.documents.get({ documentId });
      return response.data;
    } catch (error) {
      console.error('Failed to get document content:', error);
      throw error;
    }
  }
}