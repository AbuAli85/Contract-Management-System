// lib/contract-service.ts
// Enhanced contract service with data mapping validation and error handling

import { createClient } from '@/lib/supabase/client'
import { validateAndMapContractData, type DataMappingValidation } from '@/lib/contract-data-mapping'
import { getEnhancedContractTypeConfig } from '@/lib/contract-type-config'
import type { ContractGeneratorFormData } from '@/lib/schema-generator'
import type { Database } from '@/types/supabase'

export type Contract = Database['public']['Tables']['contracts']['Row']
export type ContractInsert = Database['public']['Tables']['contracts']['Insert']

// Enhanced contract service interface
export interface ContractServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  validation?: DataMappingValidation
  details?: {
    contractId?: string
    contractNumber?: string
    pdfUrl?: string
    googleDriveUrl?: string
    status?: string
  }
}

// Contract generation options
export interface ContractGenerationOptions {
  validateDataMapping?: boolean
  generatePdf?: boolean
  sendNotifications?: boolean
  autoApprove?: boolean
}

/**
 * Enhanced contract service with comprehensive validation and error handling
 */
export class ContractService {
  private supabase = createClient()

  /**
   * Generate contract with comprehensive validation
   */
  async generateContract(
    formData: ContractGeneratorFormData,
    options: ContractGenerationOptions = {}
  ): Promise<ContractServiceResponse> {
    try {
      console.log('🔄 Starting contract generation with validation...')

      // Step 1: Validate data mapping
      if (options.validateDataMapping !== false) {
        const contractTypeConfig = getEnhancedContractTypeConfig(formData.contract_type || '')
        const validation = validateAndMapContractData(formData, contractTypeConfig)

        if (!validation.isValid) {
          console.error('❌ Data mapping validation failed:', validation.errors)
          return {
            success: false,
            error: 'Contract data validation failed',
            validation,
            details: {
              status: 'validation_failed'
            }
          }
        }

        if (validation.warnings.length > 0) {
          console.warn('⚠️ Data mapping warnings:', validation.warnings)
        }

        console.log('✅ Data mapping validation passed')
      }

      // Step 2: Create contract in database
      const contractNumber = this.generateContractNumber()
      const contractData: ContractInsert = {
        contract_number: contractNumber,
        first_party_id: formData.first_party_id || '',
        second_party_id: formData.second_party_id || '',
        promoter_id: formData.promoter_id || '',
        contract_start_date: formData.contract_start_date?.toISOString(),
        contract_end_date: formData.contract_end_date?.toISOString(),
        job_title: formData.job_title || '',
        work_location: formData.work_location || '',
        department: formData.department || '',
        contract_type: formData.contract_type || '',
        currency: formData.currency || 'OMR',
        contract_value: formData.basic_salary || 0,
        email: formData.email || '',
        special_terms: formData.special_terms || '',
        status: 'draft',
        is_current: true
      }

      const { data: contract, error: insertError } = await this.supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Contract creation failed:', insertError)
        return {
          success: false,
          error: `Failed to create contract: ${insertError.message}`,
          details: {
            status: 'creation_failed'
          }
        }
      }

      console.log('✅ Contract created:', contract.id)

      // Step 3: Generate PDF if requested
      let pdfUrl: string | undefined
      if (options.generatePdf !== false) {
        const pdfResult = await this.generateContractPDF(contract.id, formData)
        if (pdfResult.success) {
          pdfUrl = pdfResult.data?.pdfUrl
        } else {
          console.warn('⚠️ PDF generation failed:', pdfResult.error)
        }
      }

      // Step 4: Send notifications if requested
      if (options.sendNotifications) {
        await this.sendContractNotifications(contract.id, 'created')
      }

      return {
        success: true,
        data: contract,
        details: {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          pdfUrl,
          status: 'created'
        }
      }

    } catch (error) {
      console.error('❌ Contract generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          status: 'error'
        }
      }
    }
  }

  /**
   * Generate contract PDF using enhanced PDF generation
   */
  async generateContractPDF(
    contractId: string,
    formData?: ContractGeneratorFormData
  ): Promise<ContractServiceResponse<{ pdfUrl: string }>> {
    try {
      console.log('📄 Generating contract PDF...')

      // Get contract data if not provided
      if (!formData) {
        const { data: contract, error } = await this.supabase
          .from('contracts')
          .select('*')
          .eq('id', contractId)
          .single()

        if (error || !contract) {
          return {
            success: false,
            error: 'Contract not found'
          }
        }

        // Convert contract data to form data format
        formData = {
          first_party_id: contract.first_party_id,
          second_party_id: contract.second_party_id,
          promoter_id: contract.promoter_id,
          contract_start_date: contract.contract_start_date ? new Date(contract.contract_start_date) : undefined,
          contract_end_date: contract.contract_end_date ? new Date(contract.contract_end_date) : undefined,
          job_title: contract.job_title || '',
          work_location: contract.work_location || '',
          department: contract.department || '',
          contract_type: contract.contract_type || '',
          currency: contract.currency || 'OMR',
          basic_salary: contract.contract_value,
          email: contract.email || '',
          special_terms: contract.special_terms || ''
        } as ContractGeneratorFormData
      }

      // Validate data mapping for PDF generation
      const contractTypeConfig = getEnhancedContractTypeConfig(formData.contract_type || '')
      const validation = validateAndMapContractData(formData, contractTypeConfig)

      if (!validation.isValid) {
        return {
          success: false,
          error: 'PDF generation validation failed',
          validation
        }
      }

      // Call PDF generation endpoint
      const response = await fetch('/api/contracts/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractId,
          templateData: validation.mappedFields,
          contractType: formData.contract_type
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || 'PDF generation failed'
        }
      }

      const result = await response.json()
      
      // Update contract with PDF URL
      await this.supabase
        .from('contracts')
        .update({ 
          pdf_url: result.pdfUrl,
          status: 'generated'
        })
        .eq('id', contractId)

      return {
        success: true,
        data: {
          pdfUrl: result.pdfUrl
        }
      }

    } catch (error) {
      console.error('❌ PDF generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed'
      }
    }
  }

  /**
   * Get contract by ID with enhanced error handling
   */
  async getContract(contractId: string): Promise<ContractServiceResponse<Contract>> {
    try {
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select(`
          *,
          first_party:parties!first_party_id(*),
          second_party:parties!second_party_id(*),
          promoters(*)
        `)
        .eq('id', contractId)
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: contract
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contract'
      }
    }
  }

  /**
   * Update contract with validation
   */
  async updateContract(
    contractId: string,
    updates: Partial<ContractInsert>
  ): Promise<ContractServiceResponse<Contract>> {
    try {
      // Validate updates if they include form data
      if (updates.contract_type) {
        const formData = updates as any
        const contractTypeConfig = getEnhancedContractTypeConfig(formData.contract_type)
        const validation = validateAndMapContractData(formData, contractTypeConfig)

        if (!validation.isValid) {
          return {
            success: false,
            error: 'Update validation failed',
            validation
          }
        }
      }

      const { data: contract, error } = await this.supabase
        .from('contracts')
        .update(updates)
        .eq('id', contractId)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: contract
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contract'
      }
    }
  }

  /**
   * Delete contract with cascade handling
   */
  async deleteContract(contractId: string): Promise<ContractServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('contracts')
        .delete()
        .eq('id', contractId)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete contract'
      }
    }
  }

  /**
   * Get contracts with filtering and pagination
   */
  async getContracts(options: {
    page?: number
    limit?: number
    status?: string
    contractType?: string
    search?: string
  } = {}): Promise<ContractServiceResponse<{
    contracts: Contract[]
    total: number
    page: number
    totalPages: number
  }>> {
    try {
      const { page = 1, limit = 10, status, contractType, search } = options
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('contracts')
        .select(`
          *,
          first_party:parties!first_party_id(*),
          second_party:parties!second_party_id(*),
          promoters(*)
        `, { count: 'exact' })

      // Apply filters
      if (status) {
        query = query.eq('status', status)
      }
      if (contractType) {
        query = query.eq('contract_type', contractType)
      }
      if (search) {
        query = query.or(`contract_number.ilike.%${search}%,job_title.ilike.%${search}%`)
      }

      const { data: contracts, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: {
          contracts: contracts || [],
          total: count || 0,
          page,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contracts'
      }
    }
  }

  /**
   * Send contract notifications
   */
  private async sendContractNotifications(
    contractId: string,
    event: 'created' | 'updated' | 'approved' | 'rejected'
  ): Promise<void> {
    try {
      // This would integrate with your notification system
      console.log(`📧 Sending ${event} notification for contract ${contractId}`)
      
      // Example: Send to notification service
      await fetch('/api/notifications/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, event })
      })
    } catch (error) {
      console.warn('⚠️ Failed to send notification:', error)
    }
  }

  /**
   * Generate unique contract number
   */
  private generateContractNumber(): string {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `PAC-${day}${month}${year}-${random}`
  }
}

// Export singleton instance
export const contractService = new ContractService()