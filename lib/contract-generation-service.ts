// Contract Generation Service - Professional End-to-End Solution
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

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
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.makecomWebhookUrl = process.env.MAKE_WEBHOOK_URL || ''
    this.googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || ''
  }

  /**
   * Generate a unique contract number
   */
  private generateContractNumber(): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const random = nanoid(6).toUpperCase()
    return `CNT-${timestamp}-${random}`
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
    const contractData = {
      contract_number: contractNumber,
      first_party_id: data.first_party_id,
      second_party_id: data.second_party_id,
      promoter_id: data.promoter_id,
      contract_start_date: data.contract_start_date.toISOString().split('T')[0],
      contract_end_date: data.contract_end_date.toISOString().split('T')[0],
      email: data.email,
      job_title: data.job_title,
      work_location: data.work_location,
      department: data.department,
      contract_type: data.contract_type,
      currency: data.currency,
      basic_salary: data.basic_salary,
      allowances: data.allowances,
      special_terms: data.special_terms,
      status: 'draft',
      is_current: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

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

      // Step 4: Trigger Make.com webhook for PDF generation
      const webhookTriggered = await this.triggerMakecomWebhook(contract)

      return {
        success: true,
        contract_id: contract.id,
        contract_number: contractNumber,
        status: webhookTriggered ? 'processing' : 'draft',
        message: webhookTriggered 
          ? 'Contract created and PDF generation initiated'
          : 'Contract created (PDF generation pending)',
        google_drive_url: this.googleDriveFolderId 
          ? `https://drive.google.com/drive/folders/${this.googleDriveFolderId}`
          : undefined
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

// Export singleton instance
export const contractGenerationService = new ContractGenerationService() 