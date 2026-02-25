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
  pdf_url?: string | undefined;
  google_drive_url?: string | undefined;
  message: string;
  errors?: string[] | undefined;
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
  pdf_url?: string | undefined;
  google_drive_url?: string | undefined;
  generated_at?: string | undefined;
  error_message?: string | undefined;
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
        throw new Error(`Failed to create contract: ${error.message}`);
      }

      return contract;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Trigger Make.com webhook for contract generation
   */
  private async triggerMakecomWebhook(contract: any): Promise<boolean> {
    try {
      if (!this.makecomWebhookUrl) {
        return false;
      }

      // Get contract type configuration
      const contractTypeConfig = getEnhancedContractTypeConfig(
        contract.contract_type
      );
      if (!contractTypeConfig) {
        return false;
      }

      // Check if this contract type supports Make.com integration
      if (!contractTypeConfig.makecomTemplateId) {
        return false;
      }

      // Fetch promoter data including image URLs
      let promoterData = null;
      if (contract.promoter_id) {
        const { data: promoter, error: promoterError } = await this.supabase
          .from('promoters')
          .select(
            'id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url, email, mobile_number'
          )
          .eq('id', contract.promoter_id)
          .single();

        if (!promoterError && promoter) {
          promoterData = promoter;
        } else {
        }
      }

      // Prepare webhook payload
      const webhookPayload = {
        contract_id: contract.id,
        contract_number: contract.contract_number,
        contract_type: contract.contract_type,
        // Include promoter data if available
        promoter_id: promoterData?.id,
        promoter_name_en: promoterData?.name_en,
        promoter_name_ar: promoterData?.name_ar,
        promoter_id_card_number: promoterData?.id_card_number,
        promoter_passport_number: promoterData?.passport_number,
        promoter_id_card_url: promoterData?.id_card_url,
        promoter_passport_url: promoterData?.passport_url,
        promoter_email: promoterData?.email,
        promoter_mobile_number: promoterData?.mobile_number,
      };

      const response = await fetch(this.makecomWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        return false;
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const result = await response.json();
        } catch (jsonError) {}
      } else {
        // Handle non-JSON responses (like "Accepted")
        const textResponse = await response.text();
      }

      return true;
    } catch (error) {
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

      // Step 2: Check if contract type is valid
      // Supports enhanced types, legacy database types, and Make.com automated types
      const validEnhancedTypes = [
        'full-time-permanent',
        'part-time-fixed',
        'consulting-agreement',
        'service-contract',
        'freelance-project',
        'partnership-agreement',
        'nda-standard',
        'vendor-supply',
        'lease-equipment',
      ];
      const validDatabaseTypes = [
        'employment',
        'service',
        'consultancy',
        'partnership',
      ];
      const validMakecomTypes = [
        'oman-unlimited-makecom',
        'oman-fixed-term-makecom',
        'oman-part-time-makecom',
      ];
      const allValidTypes = [
        ...validEnhancedTypes,
        ...validDatabaseTypes,
        ...validMakecomTypes,
      ];
      const normalizedType = String(data.contract_type).toLowerCase();

      if (!allValidTypes.includes(normalizedType)) {
        return {
          success: false,
          contract_id: '',
          contract_number: '',
          status: 'failed',
          message: `Contract type '${data.contract_type}' is not valid`,
          errors: [
            `Invalid contract type. Valid types are: ${allValidTypes.join(', ')}`,
          ],
        };
      }

      // Step 3: Generate contract number
      const contractNumber = this.generateContractNumber();

      // Step 4: Create contract in database
      const contract = await this.createContractInDatabase(
        data,
        contractNumber
      );

      // Step 5: Try to trigger Make.com webhook if configured
      if (this.makecomWebhookUrl) {
        // Try Make.com integration for webhook-based processing
        const webhookTriggered = await this.triggerMakecomWebhook(contract);

        if (webhookTriggered) {
          return {
            success: true,
            contract_id: contract.id,
            contract_number: contractNumber,
            status: 'processing',
            message: 'Contract created and sent to Make.com for processing',
            google_drive_url: this.googleDriveFolderId
              ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
              : undefined,
          };
        } else {
        }
      }

      // Step 6: Fallback to direct PDF generation
      try {
        const pdfResult = await this.generatePDFDirectly(
          contract.id,
          contractNumber
        );
        if (pdfResult.success) {
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

      return {
        success: true,
        pdf_url: publicUrl,
      };
    } catch (error) {
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
      // Get contract details
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select('contract_number, status')
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        return false;
      }

      if (contract.status !== 'processing') {
        return true;
      }

      // Generate PDF directly
      const pdfResult = await this.generatePDFDirectly(
        contractId,
        contract.contract_number
      );

      if (pdfResult.success) {
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

        return true;
      }
    } catch (error) {
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
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
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

      return true;
    } catch (error) {
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
          first_party:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
          second_party:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type),
          promoter_id
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
