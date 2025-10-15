// Contract Generation Service - Professional End-to-End Solution
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { getSupabaseConfig } from './supabase/env-check';
import { generateContractPDF } from './pdf-generator';
import {
  getEnhancedContractTypeConfig,
  generateContractWithMakecom,
} from './contract-type-config';

// Types for contract generation
export interface ContractGenerationRequest {
  first_party_id: string;
  second_party_id: string;
  promoter_id: string;
  contract_start_date: Date;
  contract_end_date: Date;
  email: string;
  job_title: string;
  work_location: string;
  department: string;
  contract_type: string;
  currency: string;
  basic_salary?: number;
  allowances?: number;
  special_terms?: string;
}

export interface ContractGenerationResponse {
  success: boolean;
  contract_id: string;
  contract_number: string;
  status:
    | 'draft'
    | 'pending'
    | 'processing'
    | 'active'
    | 'expired'
    | 'generated'
    | 'soon-to-expire'
    | 'approved'
    | 'rejected'
    | 'failed';
  pdf_url?: string;
  google_drive_url?: string;
  message: string;
  errors?: string[];
}

export interface ContractStatus {
  contract_id: string;
  status:
    | 'draft'
    | 'pending'
    | 'processing'
    | 'active'
    | 'expired'
    | 'generated'
    | 'soon-to-expire'
    | 'approved'
    | 'rejected'
    | 'failed';
  pdf_url?: string;
  google_drive_url?: string;
  generated_at?: string;
  error_message?: string;
}

class ContractGenerationService {
  private supabase: any;
  private makecomWebhookUrl: string;
  private googleDriveFolderId: string;

  constructor() {
    try {
      const config = getSupabaseConfig();
      this.supabase = createClient(
        config.url,
        config.serviceRoleKey || config.anonKey
      );
      this.makecomWebhookUrl = process.env.MAKE_WEBHOOK_URL || '';
      this.googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    } catch (error) {
      console.error(
        '❌ Failed to initialize ContractGenerationService:',
        error
      );
      throw error;
    }
  }

  /**
   * Generate a unique contract number
   */
  private generateContractNumber(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const random = nanoid(4).toUpperCase();
    return `PAC-${day}${month}${year}-${random}`;
  }

  /**
   * Validate contract data before processing
   */
  private validateContractData(data: ContractGenerationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.first_party_id) errors.push('First party (Client) is required');
    if (!data.second_party_id)
      errors.push('Second party (Employer) is required');
    if (!data.promoter_id) errors.push('Promoter is required');
    if (!data.contract_start_date)
      errors.push('Contract start date is required');
    if (!data.contract_end_date) errors.push('Contract end date is required');
    if (!data.email) errors.push('Email is required');
    if (!data.job_title) errors.push('Job title is required');
    if (!data.work_location) errors.push('Work location is required');
    if (!data.department) errors.push('Department is required');
    if (!data.contract_type) errors.push('Contract type is required');
    if (!data.currency) errors.push('Currency is required');

    // Validate dates
    if (data.contract_start_date && data.contract_end_date) {
      if (data.contract_start_date >= data.contract_end_date) {
        errors.push('Contract end date must be after start date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create contract in database
   */
  private async createContractInDatabase(
    data: ContractGenerationRequest,
    contractNumber: string
  ): Promise<any> {
    try {
      console.log('💾 Creating contract in database...');

      const contractData = {
        contract_number: contractNumber,
        first_party_id: data.first_party_id,
        second_party_id: data.second_party_id,
        promoter_id: data.promoter_id,
        contract_start_date: data.contract_start_date.toISOString(),
        contract_end_date: data.contract_end_date.toISOString(),
        email: data.email,
        job_title: data.job_title,
        work_location: data.work_location,
        department: data.department,
        contract_type: data.contract_type,
        currency: data.currency,
        basic_salary: data.basic_salary || 0,
        allowances: data.allowances || 0,
        special_terms: data.special_terms || '',
        status: 'processing',
        approval_status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: contract, error } = await this.supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Failed to create contract: ${error.message}`);
      }

      console.log('✅ Contract created in database:', contract.id);
      return contract;
    } catch (error) {
      console.error('❌ Failed to create contract in database:', error);
      throw error;
    }
  }

  /**
   * Trigger Make.com webhook for contract generation
   */
  private async triggerMakecomWebhook(contract: any): Promise<boolean> {
    try {
      if (!this.makecomWebhookUrl) {
        console.log(
          '⚠️ No Make.com webhook URL configured, skipping webhook trigger'
        );
        return false;
      }

      console.log('🔗 Triggering Make.com webhook...');
      console.log('🔗 Webhook URL:', this.makecomWebhookUrl);

      // Get contract type configuration
      const contractTypeConfig = getEnhancedContractTypeConfig(
        contract.contract_type
      );
      if (!contractTypeConfig) {
        console.error(
          '❌ Contract type configuration not found:',
          contract.contract_type
        );
        return false;
      }

      // Check if this contract type supports Make.com integration
      if (!contractTypeConfig.makecomTemplateId) {
        console.log(
          '⚠️ Contract type does not support Make.com integration:',
          contract.contract_type
        );
        return false;
      }

      // Prepare webhook payload
      const webhookPayload = {
        contract_id: contract.id,
        contract_number: contract.contract_number,
        contract_type: contract.contract_type,
      };

      console.log('📤 Sending webhook payload:', webhookPayload);

      const response = await fetch(this.makecomWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      console.log(
        '🔗 Webhook response status:',
        response.status,
        response.statusText
      );
      console.log(
        '🔗 Webhook response headers:',
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        console.error(
          '❌ Webhook request failed:',
          response.status,
          response.statusText
        );
        return false;
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const result = await response.json();
          console.log('✅ Webhook triggered successfully:', result);
        } catch (jsonError) {
          console.log(
            '⚠️ Webhook response is not valid JSON, but request was successful'
          );
        }
      } else {
        // Handle non-JSON responses (like "Accepted")
        const textResponse = await response.text();
        console.log(
          '✅ Webhook triggered successfully (non-JSON response):',
          textResponse
        );
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to trigger Make.com webhook:', error);
      return false;
    }
  }

  /**
   * Generate contract with proper template integration
   */
  async generateContract(
    data: ContractGenerationRequest
  ): Promise<ContractGenerationResponse> {
    try {
      console.log('🔄 Starting contract generation...');

      // Step 1: Validate input data
      const validation = this.validateContractData(data);
      if (!validation.isValid) {
        return {
          success: false,
          contract_id: '',
          contract_number: '',
          status: 'failed',
          message: 'Validation failed',
          errors: validation.errors,
        };
      }

      // Step 2: Check if contract type is valid (database enforces only 4 types)
      // Valid types: employment, service, consultancy, partnership
      const validDatabaseTypes = ['employment', 'service', 'consultancy', 'partnership'];
      const normalizedType = String(data.contract_type).toLowerCase();
      
      if (!validDatabaseTypes.includes(normalizedType)) {
        return {
          success: false,
          contract_id: '',
          contract_number: '',
          status: 'failed',
          message: `Contract type '${data.contract_type}' is not valid`,
          errors: [`Invalid contract type. Valid types are: ${validDatabaseTypes.join(', ')}`],
        };
      }

      console.log('📋 Contract type validated:', normalizedType);

      // Step 3: Generate contract number
      const contractNumber = this.generateContractNumber();
      console.log('📝 Generated contract number:', contractNumber);

      // Step 4: Create contract in database
      const contract = await this.createContractInDatabase(
        data,
        contractNumber
      );
      console.log('💾 Contract saved to database:', contract.id);

      // Step 5: Try to trigger Make.com webhook if configured
      if (this.makecomWebhookUrl) {
        // Try Make.com integration for webhook-based processing
        console.log('🔗 Attempting Make.com webhook integration');
        const webhookTriggered = await this.triggerMakecomWebhook(contract);

        if (webhookTriggered) {
          return {
            success: true,
            contract_id: contract.id,
            contract_number: contractNumber,
            status: 'processing',
            message:
              'Contract created and sent to Make.com for processing',
            google_drive_url: this.googleDriveFolderId
              ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
              : undefined,
          };
        } else {
          console.log(
            '⚠️ Make.com webhook failed, falling back to direct PDF generation'
          );
        }
      }

      // Step 6: Fallback to direct PDF generation
      console.log('📄 Using direct PDF generation (fallback)');
      try {
        const pdfResult = await this.generatePDFDirectly(
          contract.id,
          contractNumber
        );
        if (pdfResult.success) {
          console.log('✅ PDF generated directly:', pdfResult.pdf_url);
          return {
            success: true,
            contract_id: contract.id,
            contract_number: contractNumber,
            status: 'generated',
            pdf_url: pdfResult.pdf_url,
            message: 'Contract created and PDF generated successfully',
            google_drive_url: this.googleDriveFolderId
              ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
              : undefined,
          };
        } else {
          console.log(
            '⚠️ Direct PDF generation failed, setting to draft status'
          );
          return {
            success: true,
            contract_id: contract.id,
            contract_number: contractNumber,
            status: 'draft',
            message:
              'Contract created (PDF generation will be available later)',
            google_drive_url: this.googleDriveFolderId
              ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
              : undefined,
          };
        }
      } catch (pdfError) {
        console.error('❌ PDF generation error:', pdfError);
        return {
          success: true,
          contract_id: contract.id,
          contract_number: contractNumber,
          status: 'draft',
          message: 'Contract created (PDF generation will be available later)',
          google_drive_url: this.googleDriveFolderId
            ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
            : undefined,
        };
      }
    } catch (error) {
      console.error('❌ Contract generation failed:', error);
      return {
        success: false,
        contract_id: '',
        contract_number: '',
        status: 'failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Generate PDF directly without external webhooks
   */
  private async generatePDFDirectly(
    contractId: string,
    contractNumber: string
  ): Promise<{ success: boolean; pdf_url?: string; error?: string }> {
    try {
      console.log('📄 Generating PDF directly for contract:', contractId);

      // Fetch contract with all related data
      const { data: contract, error: contractError } = await this.supabase
        .from('contracts')
        .select(
          `
          *,
          first_party:parties!first_party_id(*),
          second_party:parties!second_party_id(*),
          promoter:promoters(*)
        `
        )
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        throw new Error('Contract not found');
      }

      // Generate PDF content using the new PDF generator
      const pdfBuffer = await generateContractPDF(contract);

      // Create a proper PDF file name
      const fileName = `contract-${contractNumber}-${Date.now()}.pdf`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } =
        await this.supabase.storage
          .from('contracts')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600',
          });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);

        // Check if it's a bucket not found error
        if (
          uploadError.message?.includes('Bucket not found') ||
          uploadError.message?.includes('404')
        ) {
          throw new Error(
            'Storage bucket "contracts" not found. Please run the storage setup script or create the bucket manually in Supabase Dashboard.'
          );
        }

        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from('contracts').getPublicUrl(fileName);

      // Update contract with PDF URL
      const { error: updateError } = await this.supabase
        .from('contracts')
        .update({
          pdf_url: publicUrl,
          status: 'generated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Failed to update contract');
      }

      // Log the activity
      await this.supabase.from('user_activity_log').insert({
        user_id: contract.user_id,
        action: 'pdf_generated',
        resource_type: 'contract',
        resource_id: contractId,
        details: {
          contract_number: contractNumber,
          pdf_url: publicUrl,
          file_name: fileName,
        },
      });

      console.log('✅ PDF generated successfully:', publicUrl);
      return {
        success: true,
        pdf_url: publicUrl,
      };
    } catch (error) {
      console.error('❌ Direct PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fix stuck processing contracts by generating PDF directly
   */
  async fixStuckProcessingContract(contractId: string): Promise<boolean> {
    try {
      console.log('🔧 Fixing stuck processing contract:', contractId);

      // Get contract details
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select('contract_number, status')
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        console.error('❌ Contract not found:', contractId);
        return false;
      }

      if (contract.status !== 'processing') {
        console.log(
          'ℹ️ Contract is not in processing status:',
          contract.status
        );
        return true;
      }

      // Generate PDF directly
      const pdfResult = await this.generatePDFDirectly(
        contractId,
        contract.contract_number
      );

      if (pdfResult.success) {
        console.log('✅ Successfully fixed stuck processing contract');
        return true;
      } else {
        // If PDF generation fails, set status to draft
        await this.supabase
          .from('contracts')
          .update({
            status: 'draft',
            updated_at: new Date().toISOString(),
          })
          .eq('id', contractId);

        console.log(
          '⚠️ Set contract to draft status due to PDF generation failure'
        );
        return true;
      }
    } catch (error) {
      console.error('❌ Error fixing stuck processing contract:', error);
      return false;
    }
  }

  /**
   * Check contract generation status
   */
  async getContractStatus(contractId: string): Promise<ContractStatus | null> {
    try {
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select(
          'id, contract_number, status, pdf_url, updated_at, error_message'
        )
        .eq('id', contractId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        contract_id: contract.id,
        status: contract.status,
        pdf_url: contract.pdf_url,
        generated_at: contract.updated_at,
        error_message: contract.error_message,
      };
    } catch (error) {
      console.error('❌ Error getting contract status:', error);
      return null;
    }
  }

  /**
   * Download contract PDF
   */
  async downloadContractPDF(
    contractId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select('pdf_url, status')
        .eq('id', contractId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!contract.pdf_url) {
        return {
          success: false,
          error:
            contract.status === 'processing'
              ? 'PDF is still being generated'
              : 'PDF not available',
        };
      }

      return {
        success: true,
        url: contract.pdf_url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update contract with PDF URL (called by Make.com webhook)
   */
  async updateContractWithPDF(
    contractIdOrNumber: string,
    pdfUrl: string,
    googleDriveUrl?: string
  ): Promise<boolean> {
    try {
      const updatePayload = {
        pdf_url: pdfUrl,
        status: 'generated',
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>;

      // Attempt to update by UUID id first
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        contractIdOrNumber
      );

      if (isUuid) {
        const { data: byIdData, error: byIdError } = await this.supabase
          .from('contracts')
          .update(updatePayload)
          .eq('id', contractIdOrNumber)
          .select('id')
          .maybeSingle();

        if (byIdError) {
          throw new Error(`Database error: ${byIdError.message}`);
        }

        if (byIdData) {
          console.log('✅ Contract updated with PDF URL (by id):', pdfUrl);
          return true;
        }
      }

      // Fallback: update by contract_number
      const { data: byNumberData, error: byNumberError } = await this.supabase
        .from('contracts')
        .update(updatePayload)
        .eq('contract_number', contractIdOrNumber)
        .select('id')
        .maybeSingle();

      if (byNumberError) {
        throw new Error(`Database error: ${byNumberError.message}`);
      }

      if (!byNumberData) {
        throw new Error('Contract not found by id or contract_number');
      }

      console.log('✅ Contract updated with PDF URL (by number):', pdfUrl);
      return true;
    } catch (error) {
      console.error('❌ Error updating contract with PDF:', error);
      return false;
    }
  }

  /**
   * Retry failed contract generation
   */
  async retryContractGeneration(contractId: string): Promise<boolean> {
    try {
      // Get contract data
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select(
          `
          *,
          first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
          second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
          promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
        `
        )
        .eq('id', contractId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Trigger webhook again
      const success = await this.triggerMakecomWebhook(contract);
      return success;
    } catch (error) {
      console.error('❌ Error retrying contract generation:', error);
      return false;
    }
  }
}

// Lazy singleton instance - only created when first accessed
let _contractGenerationService: ContractGenerationService | null = null;

export function getContractGenerationService(): ContractGenerationService {
  if (!_contractGenerationService) {
    _contractGenerationService = new ContractGenerationService();
  }
  return _contractGenerationService;
}

// For backward compatibility, export the getter as the main export
export const contractGenerationService = {
  generateContract: (data: ContractGenerationRequest) =>
    getContractGenerationService().generateContract(data),
  getContractStatus: (contractId: string) =>
    getContractGenerationService().getContractStatus(contractId),
  downloadContractPDF: (contractId: string) =>
    getContractGenerationService().downloadContractPDF(contractId),
  updateContractWithPDF: (
    contractId: string,
    pdfUrl: string,
    googleDriveUrl?: string
  ) =>
    getContractGenerationService().updateContractWithPDF(
      contractId,
      pdfUrl,
      googleDriveUrl
    ),
  retryContractGeneration: (contractId: string) =>
    getContractGenerationService().retryContractGeneration(contractId),
  fixStuckProcessingContract: (contractId: string) =>
    getContractGenerationService().fixStuckProcessingContract(contractId),
};
