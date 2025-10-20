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
    // Support both direct JSON and Base64 encoded JSON
    let credentials: any;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
      // Decode from Base64 (recommended for production)
      const decoded = Buffer.from(
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64,
        'base64'
      ).toString('utf8');
      credentials = JSON.parse(decoded);
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Direct JSON (for development)
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } else {
      throw new Error(
        'Missing Google Service Account credentials. ' +
          'Set either GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_BASE64'
      );
    }

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
    errorDetails?: any;
  }> {
    try {
      console.log('📄 Starting contract generation with Service Account...');

      // Step 0: Check storage quota first
      try {
        const about = await this.drive.about.get({
          fields: 'storageQuota,user',
        });
        const quota = about.data.storageQuota;
        if (quota.limit) {
          const used = parseInt(quota.usage || '0');
          const limit = parseInt(quota.limit);
          const available = limit - used;
          const usedPercent = ((used / limit) * 100).toFixed(1);
          console.log(
            `💾 Storage: ${usedPercent}% used (${Math.round(available / 1024 / 1024)} MB available)`
          );
        }
      } catch (quotaError) {
        console.log('⚠️ Could not check storage quota:', quotaError);
      }

      // Step 1: Copy template
      const copyResult = await this.copyTemplate(contractData.contract_number);
      if (!copyResult.success || !copyResult.documentId) {
        return {
          success: false,
          error: copyResult.error || 'Failed to copy template',
          errorDetails: copyResult.errorDetails,
        };
      }

      const documentId = copyResult.documentId;
      console.log(`✅ Template copied: ${documentId}`);

      // Step 2: Replace all text placeholders
      const replaceResult = await this.replaceTextInDocument(
        documentId,
        contractData
      );
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
    errorDetails?: any;
  }> {
    try {
      console.log('🔍 Attempting to copy template...');
      console.log('   Template ID:', TEMPLATE_ID);
      console.log('   New name:', `Contract - ${contractNumber}`);

      // First, let's try to get template info to verify access
      try {
        const templateInfo = await this.drive.files.get({
          fileId: TEMPLATE_ID,
          fields: 'id, name, permissions, owners',
        });
        console.log('✅ Template access verified:', templateInfo.data.name);
      } catch (accessError: any) {
        console.error('❌ Cannot access template:', accessError.message);
        return {
          success: false,
          error: `Cannot access template: ${accessError.message}`,
          errorDetails: {
            templateAccessError: accessError.message,
            templateId: TEMPLATE_ID,
          },
        };
      }

      const response = await this.drive.files.copy({
        fileId: TEMPLATE_ID,
        requestBody: {
          name: `Contract - ${contractNumber}`,
        },
      });

      console.log('✅ Template copied successfully:', response.data.id);
      return {
        success: true,
        documentId: response.data.id,
      };
    } catch (error: any) {
      console.error('❌ Copy template error:', error);

      // Provide detailed error information
      let errorMessage = 'Unknown error';
      let errorDetails: any = {};

      if (error.response) {
        errorMessage = error.response.data?.error?.message || error.message;
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          code: error.response.data?.error?.code,
          message: error.response.data?.error?.message,
          errors: error.response.data?.error?.errors,
          fullError: error.response.data,
        };
      } else if (error.message) {
        errorMessage = error.message;
        errorDetails = { message: error.message };
      }

      return {
        success: false,
        error: errorMessage,
        errorDetails,
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
        {
          find: '{{ref_number}}',
          replace: data.ref_number || data.contract_number,
        },
        {
          find: '{{first_party_name_ar}}',
          replace: data.first_party_name_ar || '',
        },
        {
          find: '{{first_party_name_en}}',
          replace: data.first_party_name_en || '',
        },
        { find: '{{first_party_crn}}', replace: data.first_party_crn || '' },
        {
          find: '{{second_party_name_ar}}',
          replace: data.second_party_name_ar || '',
        },
        {
          find: '{{second_party_name_en}}',
          replace: data.second_party_name_en || '',
        },
        { find: '{{second_party_crn}}', replace: data.second_party_crn || '' },
        { find: '{{promoter_name_ar}}', replace: data.promoter_name_ar || '' },
        { find: '{{promoter_name_en}}', replace: data.promoter_name_en || '' },
        { find: '{{id_card_number}}', replace: data.id_card_number || '' },
        {
          find: '{{contract_start_date}}',
          replace: data.contract_start_date || '',
        },
        {
          find: '{{contract_end_date}}',
          replace: data.contract_end_date || '',
        },
      ];

      // Build requests array for batchUpdate
      const requests = replacements.map(item => ({
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
// Temporarily disabled for build
// export const googleDocsServiceSA = new GoogleDocsServiceSA();
