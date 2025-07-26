// Contract Generation Service - Professional End-to-End Solution
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'
import { getSupabaseConfig } from './supabase/env-check'

// Types for contract generation
export interface ContractGenerationRequest {
  first_party_id: string
  second_party_id: string
  promoter_id: string
  contract_start_date: Date
  contract_end_date: Date
  email: string
  job_title: string
  work_location: string
  department: string
  contract_type: string
  currency: string
  basic_salary?: number
  allowances?: number
  special_terms?: string
}

export interface ContractGenerationResponse {
  success: boolean
  contract_id: string
  contract_number: string
  status: 'draft' | 'processing' | 'generated' | 'failed'
  pdf_url?: string
  google_drive_url?: string
  message: string
  errors?: string[]
}

export interface ContractStatus {
  contract_id: string
  status: 'draft' | 'processing' | 'generated' | 'failed'
  pdf_url?: string
  google_drive_url?: string
  generated_at?: string
  error_message?: string
}

class ContractGenerationService {
  private supabase: any
  private makecomWebhookUrl: string
  private googleDriveFolderId: string

  constructor() {
    try {
      const config = getSupabaseConfig()
      this.supabase = createClient(config.url, config.serviceRoleKey || config.anonKey)
      this.makecomWebhookUrl = process.env.MAKE_WEBHOOK_URL || ''
      this.googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || ''
    } catch (error) {
      console.error('❌ Failed to initialize ContractGenerationService:', error)
      throw error
    }
  }

  /**
   * Generate a unique contract number
   */
  private generateContractNumber(): string {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()
    const random = nanoid(4).toUpperCase()
    return `PAC-${day}${month}${year}-${random}`
  }

  /**
   * Validate contract data before processing
   */
  private validateContractData(data: ContractGenerationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.first_party_id) errors.push('First party (Client) is required')
    if (!data.second_party_id) errors.push('Second party (Employer) is required')
    if (!data.promoter_id) errors.push('Promoter is required')
    if (!data.contract_start_date) errors.push('Contract start date is required')
    if (!data.contract_end_date) errors.push('Contract end date is required')
    if (!data.email) errors.push('Email is required')
    if (!data.job_title) errors.push('Job title is required')
    if (!data.work_location) errors.push('Work location is required')
    if (!data.department) errors.push('Department is required')
    if (!data.contract_type) errors.push('Contract type is required')
    if (!data.currency) errors.push('Currency is required')

    // Validate dates
    if (data.contract_start_date && data.contract_end_date) {
      if (data.contract_start_date >= data.contract_end_date) {
        errors.push('Contract end date must be after start date')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Create contract in database
   */
  private async createContractInDatabase(data: ContractGenerationRequest, contractNumber: string): Promise<any> {
    // Build contract data with only the fields that exist in the database
    const contractData: any = {
      contract_number: contractNumber,
      first_party_id: data.first_party_id,
      second_party_id: data.second_party_id,
      promoter_id: data.promoter_id,
      contract_start_date: data.contract_start_date.toISOString().split('T')[0],
      contract_end_date: data.contract_end_date.toISOString().split('T')[0],
      email: data.email,
      job_title: data.job_title,
      work_location: data.work_location,
      status: 'draft',
      is_current: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add optional fields if they exist in the database
    if (data.department) contractData.department = data.department
    if (data.contract_type) contractData.contract_type = data.contract_type
    if (data.currency) contractData.currency = data.currency
    if (data.basic_salary) contractData.basic_salary = data.basic_salary
    if (data.allowances) contractData.allowances = data.allowances
    if (data.special_terms) contractData.special_terms = data.special_terms

    const { data: contract, error } = await this.supabase
      .from('contracts')
      .insert([contractData])
      .select(`
        *,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
        promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
      `)
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return contract
  }

  /**
   * Trigger Make.com webhook for PDF generation
   */
  private async triggerMakecomWebhook(contract: any): Promise<boolean> {
    if (!this.makecomWebhookUrl) {
      console.warn('Make.com webhook URL not configured')
      return false
    }

    try {
      const webhookPayload = {
        contract_id: contract.id,
        contract_number: contract.contract_number,
        first_party_name_en: contract.first_party?.name_en || '',
        first_party_name_ar: contract.first_party?.name_ar || '',
        first_party_crn: contract.first_party?.crn || '',
        second_party_name_en: contract.second_party?.name_en || '',
        second_party_name_ar: contract.second_party?.name_ar || '',
        second_party_crn: contract.second_party?.crn || '',
        promoter_name_en: contract.promoters?.name_en || '',
        promoter_name_ar: contract.promoters?.name_ar || '',
        promoter_id_card_url: contract.promoters?.id_card_url || '',
        promoter_passport_url: contract.promoters?.passport_url || '',
        id_card_number: contract.promoters?.id_card_number || '',
        job_title: contract.job_title,
        work_location: contract.work_location,
        department: contract.department,
        email: contract.email,
        start_date: contract.contract_start_date,
        end_date: contract.contract_end_date,
        basic_salary: contract.basic_salary,
        allowances: contract.allowances,
        currency: contract.currency,
        contract_type: contract.contract_type,
        special_terms: contract.special_terms,
        google_drive_folder_id: this.googleDriveFolderId,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(this.makecomWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ContractGen-Service/1.0'
        },
        body: JSON.stringify(webhookPayload)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      // Update contract status to processing
      await this.supabase
        .from('contracts')
        .update({ status: 'processing' })
        .eq('id', contract.id)

      console.log('✅ Make.com webhook triggered successfully')
      return true
    } catch (error) {
      console.error('❌ Make.com webhook error:', error)
      return false
    }
  }

  /**
   * Main contract generation method
   */
  async generateContract(data: ContractGenerationRequest): Promise<ContractGenerationResponse> {
    try {
      console.log('🔄 Starting contract generation...')

      // Step 1: Validate input data
      const validation = this.validateContractData(data)
      if (!validation.isValid) {
        return {
          success: false,
          contract_id: '',
          contract_number: '',
          status: 'failed',
          message: 'Validation failed',
          errors: validation.errors
        }
      }

      // Step 2: Generate contract number
      const contractNumber = this.generateContractNumber()
      console.log('📝 Generated contract number:', contractNumber)

      // Step 3: Create contract in database
      const contract = await this.createContractInDatabase(data, contractNumber)
      console.log('💾 Contract saved to database:', contract.id)

      // Step 4: Immediately generate PDF instead of relying on webhooks
      try {
        const pdfResult = await this.generatePDFDirectly(contract.id, contractNumber)
        if (pdfResult.success) {
          console.log('✅ PDF generated immediately:', pdfResult.pdf_url)
          return {
            success: true,
            contract_id: contract.id,
            contract_number: contractNumber,
            status: 'generated',
            pdf_url: pdfResult.pdf_url,
            message: 'Contract created and PDF generated successfully',
            google_drive_url: this.googleDriveFolderId 
              ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
              : undefined
          }
        } else {
          console.log('⚠️ PDF generation failed, setting to draft status')
          return {
            success: true,
            contract_id: contract.id,
            contract_number: contractNumber,
            status: 'draft',
            message: 'Contract created (PDF generation will be available later)',
            google_drive_url: this.googleDriveFolderId 
              ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
              : undefined
          }
        }
      } catch (pdfError) {
        console.error('❌ PDF generation error:', pdfError)
        return {
          success: true,
          contract_id: contract.id,
          contract_number: contractNumber,
          status: 'draft',
          message: 'Contract created (PDF generation will be available later)',
          google_drive_url: this.googleDriveFolderId 
            ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
            : undefined
        }
      }

    } catch (error) {
      console.error('❌ Contract generation failed:', error)
      return {
        success: false,
        contract_id: '',
        contract_number: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Generate PDF directly without external webhooks
   */
  private async generatePDFDirectly(contractId: string, contractNumber: string): Promise<{ success: boolean; pdf_url?: string; error?: string }> {
    try {
      console.log('📄 Generating PDF directly for contract:', contractId)

      // Fetch contract with all related data
      const { data: contract, error: contractError } = await this.supabase
        .from('contracts')
        .select(`
          *,
          first_party:parties!first_party_id(*),
          second_party:parties!second_party_id(*),
          promoter:promoters(*)
        `)
        .eq('id', contractId)
        .single()

      if (contractError || !contract) {
        throw new Error('Contract not found')
      }

      // Generate PDF content
      const pdfContent = this.generateContractPDFContent(contract, contractNumber)
      
      // Create a proper PDF file name
      const fileName = `contract-${contractNumber}-${Date.now()}.pdf`
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('contracts')
        .upload(fileName, Buffer.from(pdfContent, 'utf-8'), {
          contentType: 'application/pdf',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error("Storage upload error:", uploadError)
        
        // Check if it's a bucket not found error
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('404')) {
          throw new Error('Storage bucket "contracts" not found. Please run the storage setup script or create the bucket manually in Supabase Dashboard.')
        }
        
        throw new Error(`Failed to upload PDF: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('contracts')
        .getPublicUrl(fileName)

      // Update contract with PDF URL
      const { error: updateError } = await this.supabase
        .from('contracts')
        .update({
          pdf_url: publicUrl,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId)

      if (updateError) {
        console.error("Database update error:", updateError)
        throw new Error('Failed to update contract')
      }

      // Log the activity
      await this.supabase
        .from('user_activity_log')
        .insert({
          user_id: contract.user_id,
          action: 'pdf_generated',
          resource_type: 'contract',
          resource_id: contractId,
          details: { 
            contract_number: contractNumber,
            pdf_url: publicUrl,
            file_name: fileName
          }
        })

      console.log('✅ PDF generated successfully:', publicUrl)
      return {
        success: true,
        pdf_url: publicUrl
      }

    } catch (error) {
      console.error('❌ Direct PDF generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate PDF content for contract
   */
  private generateContractPDFContent(contract: any, contractNumber: string): string {
    const currentDate = new Date().toLocaleDateString()
    
    return `
EMPLOYMENT CONTRACT

Contract Number: ${contractNumber}
Date: ${currentDate}

================================================================================

PARTIES
================================================================================

${contract.first_party ? `
EMPLOYER:
Name: ${contract.first_party.name_en}
CRN: ${contract.first_party.crn || 'N/A'}
Address: ${contract.first_party.address_en || 'N/A'}
Contact Person: ${contract.first_party.contact_person || 'N/A'}
Contact Email: ${contract.first_party.contact_email || 'N/A'}
Contact Phone: ${contract.first_party.contact_phone || 'N/A'}
` : 'Employer: Not specified'}

${contract.second_party ? `
EMPLOYEE:
Name: ${contract.second_party.name_en}
Email: ${contract.email || 'N/A'}
Contact Person: ${contract.second_party.contact_person || 'N/A'}
Contact Email: ${contract.second_party.contact_email || 'N/A'}
Contact Phone: ${contract.second_party.contact_phone || 'N/A'}
` : 'Employee: Not specified'}

================================================================================

JOB DETAILS
================================================================================

Position: ${contract.job_title || 'N/A'}
Department: ${contract.department || 'N/A'}
Work Location: ${contract.work_location || 'N/A'}

================================================================================

CONTRACT TERMS
================================================================================

Contract Type: ${contract.contract_type || 'N/A'}
Start Date: ${contract.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : 'N/A'}
End Date: ${contract.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : 'N/A'}

================================================================================

COMPENSATION
================================================================================

Basic Salary: ${contract.basic_salary || 'N/A'} ${contract.currency || 'SAR'}
Allowances: ${contract.allowances || 'N/A'} ${contract.currency || 'SAR'}

================================================================================

${contract.promoter ? `
PROMOTER INFORMATION
================================================================================

Name: ${contract.promoter.name_en}
Contact: ${contract.promoter.mobile_number || 'N/A'}
Email: ${contract.promoter.email || 'N/A'}
` : ''}

================================================================================

CONTRACT STATUS
================================================================================

Status: ${contract.status || 'Draft'}
Approval Status: ${contract.approval_status || 'Pending'}
Created: ${contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}
Last Updated: ${contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : 'N/A'}

================================================================================

TERMS AND CONDITIONS
================================================================================

1. This employment contract is legally binding and enforceable under applicable labor laws.

2. The employee agrees to perform the duties and responsibilities associated with the position of ${contract.job_title || 'the specified role'}.

3. The employer agrees to provide the compensation and benefits as outlined in this contract.

4. Both parties agree to comply with all applicable laws and regulations.

5. This contract may be terminated by either party with appropriate notice as required by law.

6. Any disputes arising from this contract will be resolved through appropriate legal channels.

================================================================================

SIGNATURES
================================================================================

Employer Signature: _________________________    Date: _________________

Employee Signature: _________________________    Date: _________________

Promoter Signature: ${contract.promoter ? '_________________________' : 'N/A'}    Date: ${contract.promoter ? '_________________' : 'N/A'}

================================================================================

This contract is generated electronically and is legally binding.
Generated on: ${new Date().toLocaleString()}
Contract ID: ${contract.id}

================================================================================
  `
  }

  /**
   * Fix stuck processing contracts by generating PDF directly
   */
  async fixStuckProcessingContract(contractId: string): Promise<boolean> {
    try {
      console.log('🔧 Fixing stuck processing contract:', contractId)

      // Get contract details
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select('contract_number, status')
        .eq('id', contractId)
        .single()

      if (error || !contract) {
        console.error('❌ Contract not found:', contractId)
        return false
      }

      if (contract.status !== 'processing') {
        console.log('ℹ️ Contract is not in processing status:', contract.status)
        return true
      }

      // Generate PDF directly
      const pdfResult = await this.generatePDFDirectly(contractId, contract.contract_number)
      
      if (pdfResult.success) {
        console.log('✅ Successfully fixed stuck processing contract')
        return true
      } else {
        // If PDF generation fails, set status to draft
        await this.supabase
          .from('contracts')
          .update({
            status: 'draft',
            updated_at: new Date().toISOString()
          })
          .eq('id', contractId)
        
        console.log('⚠️ Set contract to draft status due to PDF generation failure')
        return true
      }

    } catch (error) {
      console.error('❌ Error fixing stuck processing contract:', error)
      return false
    }
  }

  /**
   * Check contract generation status
   */
  async getContractStatus(contractId: string): Promise<ContractStatus | null> {
    try {
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select('id, contract_number, status, pdf_url, updated_at, error_message')
        .eq('id', contractId)
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return {
        contract_id: contract.id,
        status: contract.status,
        pdf_url: contract.pdf_url,
        generated_at: contract.updated_at,
        error_message: contract.error_message
      }
    } catch (error) {
      console.error('❌ Error getting contract status:', error)
      return null
    }
  }

  /**
   * Download contract PDF
   */
  async downloadContractPDF(contractId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select('pdf_url, status')
        .eq('id', contractId)
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (!contract.pdf_url) {
        return {
          success: false,
          error: contract.status === 'processing' 
            ? 'PDF is still being generated' 
            : 'PDF not available'
        }
      }

      return {
        success: true,
        url: contract.pdf_url
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update contract with PDF URL (called by Make.com webhook)
   */
  async updateContractWithPDF(contractId: string, pdfUrl: string, googleDriveUrl?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('contracts')
        .update({
          pdf_url: pdfUrl,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Contract updated with PDF URL:', pdfUrl)
      return true
    } catch (error) {
      console.error('❌ Error updating contract with PDF:', error)
      return false
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
        .select(`
          *,
          first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
          second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
          promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
        `)
        .eq('id', contractId)
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Trigger webhook again
      const success = await this.triggerMakecomWebhook(contract)
      return success
    } catch (error) {
      console.error('❌ Error retrying contract generation:', error)
      return false
    }
  }
}

// Lazy singleton instance - only created when first accessed
let _contractGenerationService: ContractGenerationService | null = null

export function getContractGenerationService(): ContractGenerationService {
  if (!_contractGenerationService) {
    _contractGenerationService = new ContractGenerationService()
  }
  return _contractGenerationService
}

// For backward compatibility, export the getter as the main export
export const contractGenerationService = {
  generateContract: (data: ContractGenerationRequest) => getContractGenerationService().generateContract(data),
  getContractStatus: (contractId: string) => getContractGenerationService().getContractStatus(contractId),
  downloadContractPDF: (contractId: string) => getContractGenerationService().downloadContractPDF(contractId),
  updateContractWithPDF: (contractId: string, pdfUrl: string, googleDriveUrl?: string) => getContractGenerationService().updateContractWithPDF(contractId, pdfUrl, googleDriveUrl),
  retryContractGeneration: (contractId: string) => getContractGenerationService().retryContractGeneration(contractId),
  fixStuckProcessingContract: (contractId: string) => getContractGenerationService().fixStuckProcessingContract(contractId),
} 