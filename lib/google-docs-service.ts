/**
 * Google Docs Service
 * Handles contract generation using Google Docs API
 * Bypasses Make.com restrictions with Gmail accounts
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

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

export class GoogleDocsService {
  private auth: OAuth2Client;
  private docs: any;
  private drive: any;

  constructor() {
    // Initialize OAuth2 client
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials
    this.auth.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
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
      console.log('📄 Starting contract generation...');

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

      // You can save this to Supabase storage or return the URL
      const pdfUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`;

      return {
        success: true,
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
export const googleDocsService = new GoogleDocsService();

