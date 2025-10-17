/**
 * Google Docs Service with Service Account
 * Uses Service Account instead of OAuth to avoid restricted scope issues
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const TEMPLATE_ID = '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0';

interface ContractData {
  ref_number: string;
  contract_number: string;
  first_party_name_ar: string;
  first_party_name_en: string;
  first_party_crn: string;
  second_party_name_ar: string;
  second_party_name_en: string;
  second_party_crn: string;
  promoter_name_ar: string;
  promoter_name_en: string;
  id_card_number: string;
  contract_start_date: string;
  contract_end_date: string;
}

export class GoogleDocsServiceSA {
  private auth: JWT;
  private docs: any;
  private drive: any;

  constructor() {
    // Parse service account credentials from environment
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

    // Create JWT client
    this.auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
      ],
    });

    // Initialize Google APIs
    this.docs = google.docs({ version: 'v1', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * Generate contract from template
   */
  async generateContract(contractData: ContractData): Promise<{
    success: boolean;
    documentId?: string;
    documentUrl?: string;
    pdfUrl?: string;
    error?: string;
  }> {
    try {
      console.log('📄 Starting contract generation with Service Account...');

      // Step 1: Copy template
      const copyResult = await this.copyTemplate(contractData.contract_number);
      if (!copyResult.success || !copyResult.documentId) {
        return { success: false, error: 'Failed to copy template' };
      }

      const documentId = copyResult.documentId;
      console.log(`✅ Template copied: ${documentId}`);

      // Step 2: Replace all text placeholders
      const replaceResult = await this.replaceTextInDocument(documentId, contractData);
      if (!replaceResult.success) {
        return { success: false, error: 'Failed to replace text' };
      }

      console.log('✅ Text replacements completed');

      // Step 3: Get document URLs
      const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
      const pdfUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`;

      return {
        success: true,
        documentId,
        documentUrl,
        pdfUrl,
      };
    } catch (error) {
      console.error('❌ Contract generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Copy template document
   */
  private async copyTemplate(contractNumber: string): Promise<{
    success: boolean;
    documentId?: string;
    error?: string;
  }> {
    try {
      const response = await this.drive.files.copy({
        fileId: TEMPLATE_ID,
        requestBody: {
          name: `Contract - ${contractNumber}`,
        },
      });

      return {
        success: true,
        documentId: response.data.id,
      };
    } catch (error) {
      console.error('❌ Copy template error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Replace all text placeholders in document
   */
  private async replaceTextInDocument(
    documentId: string,
    data: ContractData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Define all text replacements
      const replacements = [
        { find: '{{ref_number}}', replace: data.ref_number || data.contract_number },
        { find: '{{first_party_name_ar}}', replace: data.first_party_name_ar || '' },
        { find: '{{first_party_name_en}}', replace: data.first_party_name_en || '' },
        { find: '{{first_party_crn}}', replace: data.first_party_crn || '' },
        { find: '{{second_party_name_ar}}', replace: data.second_party_name_ar || '' },
        { find: '{{second_party_name_en}}', replace: data.second_party_name_en || '' },
        { find: '{{second_party_crn}}', replace: data.second_party_crn || '' },
        { find: '{{promoter_name_ar}}', replace: data.promoter_name_ar || '' },
        { find: '{{promoter_name_en}}', replace: data.promoter_name_en || '' },
        { find: '{{id_card_number}}', replace: data.id_card_number || '' },
        { find: '{{contract_start_date}}', replace: data.contract_start_date || '' },
        { find: '{{contract_end_date}}', replace: data.contract_end_date || '' },
      ];

      // Build requests array for batchUpdate
      const requests = replacements.map((item) => ({
        replaceAllText: {
          containsText: {
            text: item.find,
            matchCase: true,
          },
          replaceText: item.replace,
        },
      }));

      // Execute batch update
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Replace text error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export document as PDF
   */
  async exportToPDF(documentId: string): Promise<{
    success: boolean;
    pdfBuffer?: Buffer;
    pdfUrl?: string;
    error?: string;
  }> {
    try {
      const response = await this.drive.files.export(
        {
          fileId: documentId,
          mimeType: 'application/pdf',
        },
        { responseType: 'arraybuffer' }
      );

      const pdfUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`;

      return {
        success: true,
        pdfBuffer: Buffer.from(response.data as ArrayBuffer),
        pdfUrl,
      };
    } catch (error) {
      console.error('❌ Export PDF error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const googleDocsServiceSA = new GoogleDocsServiceSA();

