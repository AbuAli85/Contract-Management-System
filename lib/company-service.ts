import { createClient } from '@/lib/supabase/client'
import type { CompanyProfile, Employee, CompanyServiceResponse, EmployeeServiceResponse, UserRole } from '@/types/company'



/**
 * Company Service for managing company profiles, employees, and related operations
 */
export class CompanyService {
  
  /**
   * Create a new company profile
   */
  static async createCompanyProfile(profileData: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>): Promise<CompanyServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { data, error } = await supabase
        .from('company_profiles')
        .insert({
          ...profileData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating company profile:', error)
        return { error: error.message }
      }

      return { data, message: 'Company profile created successfully' }
    } catch (error) {
      console.error('Unexpected error creating company profile:', error)
      return { error: 'Failed to create company profile' }
    }
  }

  /**
   * Get company profile by user ID
   */
  static async getCompanyProfileByUserId(userId: string): Promise<CompanyServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { message: 'No company profile found' }
        }
        console.error('Error fetching company profile:', error)
        return { error: error.message }
      }

      return { data }
    } catch (error) {
      console.error('Unexpected error fetching company profile:', error)
      return { error: 'Failed to fetch company profile' }
    }
  }

  /**
   * Update company profile
   */
  static async updateCompanyProfile(id: string, updates: Partial<CompanyProfile>): Promise<CompanyServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { data, error } = await supabase
        .from('company_profiles')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating company profile:', error)
        return { error: error.message }
      }

      return { data, message: 'Company profile updated successfully' }
    } catch (error) {
      console.error('Unexpected error updating company profile:', error)
      return { error: 'Failed to update company profile' }
    }
  }

  /**
   * Get all company profiles with filtering
   */
  static async getCompanyProfiles(filters?: {
    role?: UserRole
    verification_status?: string
    is_active?: boolean
    limit?: number
  }): Promise<CompanyServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      let query = supabase
        .from('company_profiles')
        .select('*')

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }
      
      if (filters?.verification_status) {
        query = query.eq('verification_status', filters.verification_status)
      }
      
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching company profiles:', error)
        return { error: error.message }
      }

      return { data }
    } catch (error) {
      console.error('Unexpected error fetching company profiles:', error)
      return { error: 'Failed to fetch company profiles' }
    }
  }

  /**
   * Upload company logo to Supabase Storage
   */
  static async uploadCompanyLogo(file: File, companyId: string): Promise<{ url?: string; error?: string }> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${companyId}/logo.${fileExt}`
      const filePath = `company-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading logo:', uploadError)
        return { error: uploadError.message }
      }

      const { data } = supabase.storage
        .from('company-documents')
        .getPublicUrl(filePath)

      return { url: data.publicUrl }
    } catch (error) {
      console.error('Unexpected error uploading logo:', error)
      return { error: 'Failed to upload logo' }
    }
  }

  /**
   * Verify company profile
   */
  static async verifyCompanyProfile(id: string, verified: boolean): Promise<CompanyServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { data, error } = await supabase
        .from('company_profiles')
        .update({
          verification_status: verified ? 'verified' : 'rejected',
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error verifying company profile:', error)
        return { error: error.message }
      }

      return { data, message: `Company profile ${verified ? 'verified' : 'rejected'} successfully` }
    } catch (error) {
      console.error('Unexpected error verifying company profile:', error)
      return { error: 'Failed to verify company profile' }
    }
  }

  // Employee Management Methods

  /**
   * Add employee to company
   */
  static async addEmployee(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<EmployeeServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { data, error } = await supabase
        .from('company_employees')
        .insert({
          ...employeeData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding employee:', error)
        return { error: error.message }
      }

      return { data, message: 'Employee added successfully' }
    } catch (error) {
      console.error('Unexpected error adding employee:', error)
      return { error: 'Failed to add employee' }
    }
  }

  /**
   * Get employees for a company
   */
  static async getCompanyEmployees(companyId: string, filters?: {
    employment_status?: string
    employee_type?: string
    department?: string
  }): Promise<EmployeeServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      let query = supabase
        .from('company_employees')
        .select('*')
        .eq('company_id', companyId)

      if (filters?.employment_status) {
        query = query.eq('employment_status', filters.employment_status)
      }
      
      if (filters?.employee_type) {
        query = query.eq('employee_type', filters.employee_type)
      }
      
      if (filters?.department) {
        query = query.eq('department', filters.department)
      }

      query = query.order('joining_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching company employees:', error)
        return { error: error.message }
      }

      return { data }
    } catch (error) {
      console.error('Unexpected error fetching company employees:', error)
      return { error: 'Failed to fetch company employees' }
    }
  }

  /**
   * Update employee information
   */
  static async updateEmployee(id: string, updates: Partial<Employee>): Promise<EmployeeServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { data, error } = await supabase
        .from('company_employees')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating employee:', error)
        return { error: error.message }
      }

      return { data, message: 'Employee updated successfully' }
    } catch (error) {
      console.error('Unexpected error updating employee:', error)
      return { error: 'Failed to update employee' }
    }
  }

  /**
   * Remove employee from company
   */
  static async removeEmployee(id: string): Promise<EmployeeServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { error } = await supabase
        .from('company_employees')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error removing employee:', error)
        return { error: error.message }
      }

      return { message: 'Employee removed successfully' }
    } catch (error) {
      console.error('Unexpected error removing employee:', error)
      return { error: 'Failed to remove employee' }
    }
  }

  /**
   * Get companies expiring documents
   */
  static async getExpiringDocuments(daysAhead: number = 30): Promise<CompanyServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysAhead)

      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .or(`cr_expiry_date.lte.${targetDate.toISOString()},license_expiry_date.lte.${targetDate.toISOString()}`)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching expiring documents:', error)
        return { error: error.message }
      }

      return { data }
    } catch (error) {
      console.error('Unexpected error fetching expiring documents:', error)
      return { error: 'Failed to fetch expiring documents' }
    }
  }

  /**
   * Search companies by name or CR number
   */
  static async searchCompanies(searchTerm: string): Promise<CompanyServiceResponse> {
    try {
      const supabase = createClient()
      if (!supabase) {
        return { error: 'Supabase client not available' }
      }

      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .or(`company_name.ilike.%${searchTerm}%,commercial_registration.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(20)

      if (error) {
        console.error('Error searching companies:', error)
        return { error: error.message }
      }

      return { data }
    } catch (error) {
      console.error('Unexpected error searching companies:', error)
      return { error: 'Failed to search companies' }
    }
  }
}

export default CompanyService
