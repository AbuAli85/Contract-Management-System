import { createClient } from '@/lib/supabase/server'
import { getUserRoleInfo, hasPermission } from '@/lib/enhanced-rbac'

// Company data interfaces
export interface CompanyCreateData {
  name: string
  slug: string
  email?: string | null
  phone?: string
  website?: string
  description?: string
  business_type?: 'individual' | 'small_business' | 'enterprise' | 'non_profit'
  address?: Record<string, any>
  settings?: Record<string, any>
  createdBy: string
}

export interface CompanyUpdateData extends Partial<CompanyCreateData> {
  id: string
  is_active?: boolean
  is_verified?: boolean
}

export interface CompanyResponse {
  id: string
  name: string
  slug: string
  email?: string
  phone?: string
  website?: string
  description?: string
  logo_url?: string
  business_type: string
  address: Record<string, any>
  settings: Record<string, any>
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  created_by: string
  lower_email?: string
}

/**
 * Upsert company using email-based conflict resolution
 * Uses the lower_email generated column for case-insensitive email matching
 */
export async function upsertCompany(data: CompanyCreateData): Promise<CompanyResponse> {
  const supabase = createClient()

  // Validate permissions
  const { role } = await getUserRoleInfo(data.createdBy)
  if (!hasPermission(role, 'companies.create')) {
    throw new Error('Insufficient permissions to create/update companies')
  }

  // Validate required fields
  if (!data.name?.trim()) {
    throw new Error('Company name is required')
  }
  
  if (!data.slug?.trim()) {
    throw new Error('Company slug is required')
  }

  // Validate slug format (URL-friendly)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(data.slug)) {
    throw new Error('Slug must be lowercase, alphanumeric, and hyphen-separated')
  }

  // Validate email format if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format')
    }
  }

  try {
    const companyData = {
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      website: data.website?.trim() || null,
      description: data.description?.trim() || null,
      business_type: data.business_type || 'small_business',
      address: data.address || {},
      settings: data.settings || {},
      created_by: data.createdBy,
      is_active: true,
      is_verified: false
    }

    const { data: result, error } = await supabase
      .from('companies')
      .upsert([companyData], {
        onConflict: 'lower_email', // Uses the generated lower_email column
        ignoreDuplicates: false
      })
      .select(`
        id,
        name,
        slug,
        email,
        phone,
        website,
        description,
        logo_url,
        business_type,
        address,
        settings,
        is_active,
        is_verified,
        created_at,
        updated_at,
        created_by,
        lower_email
      `)
      .single()

    if (error) {
      console.error('Error upserting company:', error)
      
      // Handle specific constraint violations
      if (error.code === '23505') {
        if (error.message.includes('companies_slug_unique')) {
          throw new Error('A company with this slug already exists')
        }
        if (error.message.includes('companies_lower_email_unique')) {
          throw new Error('A company with this email already exists')
        }
      }
      
      throw new Error(`Failed to create/update company: ${error.message}`)
    }

    if (!result) {
      throw new Error('No data returned from company upsert operation')
    }

    return result as CompanyResponse

  } catch (error) {
    console.error('Company upsert service error:', error)
    throw error
  }
}

/**
 * Alternative upsert by slug for cases where email is not available
 */
export async function upsertCompanyBySlug(data: CompanyCreateData): Promise<CompanyResponse> {
  const supabase = createClient()

  // Validate permissions
  const { role } = await getUserRoleInfo(data.createdBy)
  if (!hasPermission(role, 'companies.create')) {
    throw new Error('Insufficient permissions to create/update companies')
  }

  try {
    const companyData = {
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      website: data.website?.trim() || null,
      description: data.description?.trim() || null,
      business_type: data.business_type || 'small_business',
      address: data.address || {},
      settings: data.settings || {},
      created_by: data.createdBy,
      is_active: true,
      is_verified: false
    }

    const { data: result, error } = await supabase
      .from('companies')
      .upsert([companyData], {
        onConflict: 'slug', // Uses the slug constraint
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error upserting company by slug:', error)
      throw new Error(`Failed to create/update company: ${error.message}`)
    }

    return result as CompanyResponse

  } catch (error) {
    console.error('Company upsert by slug service error:', error)
    throw error
  }
}

/**
 * Get company by ID with permission checking
 */
export async function getCompany(id: string, userId: string): Promise<CompanyResponse | null> {
  const supabase = createClient()

  try {
    const { role } = await getUserRoleInfo(userId)
    
    let query = supabase
      .from('companies')
      .select('*')
      .eq('id', id)

    // Apply role-based filtering
    if (!hasPermission(role, 'companies.view')) {
      // Users can only see their own company or active companies
      query = query.or(`created_by.eq.${userId},is_active.eq.true`)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      throw error
    }

    return data as CompanyResponse

  } catch (error) {
    console.error('Error fetching company:', error)
    throw error
  }
}

/**
 * Update company with permission checking
 */
export async function updateCompany(data: CompanyUpdateData, userId: string): Promise<CompanyResponse> {
  const supabase = createClient()

  try {
    const { role } = await getUserRoleInfo(userId)
    
    // Check if user can edit this company
    const company = await getCompany(data.id, userId)
    if (!company) {
      throw new Error('Company not found')
    }

    // Permission check
    const canEdit = hasPermission(role, 'companies.edit') || company.created_by === userId
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit this company')
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.name) updateData.name = data.name.trim()
    if (data.slug) updateData.slug = data.slug.trim().toLowerCase()
    if (data.email !== undefined) updateData.email = data.email?.trim() || null
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null
    if (data.website !== undefined) updateData.website = data.website?.trim() || null
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.business_type) updateData.business_type = data.business_type
    if (data.address) updateData.address = data.address
    if (data.settings) updateData.settings = data.settings
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    if (data.is_verified !== undefined && hasPermission(role, 'companies.edit')) {
      updateData.is_verified = data.is_verified
    }

    const { data: result, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', data.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating company:', error)
      throw new Error(`Failed to update company: ${error.message}`)
    }

    return result as CompanyResponse

  } catch (error) {
    console.error('Company update service error:', error)
    throw error
  }
}

/**
 * List companies with filtering and pagination
 */
export async function listCompanies(
  userId: string,
  options: {
    page?: number
    limit?: number
    search?: string
    business_type?: string
    is_active?: boolean
    is_verified?: boolean
  } = {}
): Promise<{
  data: CompanyResponse[]
  total: number
  page: number
  limit: number
  pages: number
}> {
  const supabase = createClient()

  try {
    const { role } = await getUserRoleInfo(userId)
    const page = options.page || 1
    const limit = Math.min(options.limit || 20, 100) // Max 100 per page
    const offset = (page - 1) * limit

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })

    // Apply role-based filtering
    if (!hasPermission(role, 'companies.view')) {
      query = query.or(`created_by.eq.${userId},is_active.eq.true`)
    }

    // Apply filters
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
    }
    if (options.business_type) {
      query = query.eq('business_type', options.business_type)
    }
    if (options.is_active !== undefined) {
      query = query.eq('is_active', options.is_active)
    }
    if (options.is_verified !== undefined) {
      query = query.eq('is_verified', options.is_verified)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error listing companies:', error)
      throw new Error(`Failed to fetch companies: ${error.message}`)
    }

    return {
      data: (data || []) as CompanyResponse[],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit)
    }

  } catch (error) {
    console.error('Company list service error:', error)
    throw error
  }
}

/**
 * Delete company (soft delete by setting is_active = false)
 */
export async function deleteCompany(id: string, userId: string): Promise<void> {
  const supabase = createClient()

  try {
    const { role } = await getUserRoleInfo(userId)
    
    // Check permissions
    if (!hasPermission(role, 'companies.delete')) {
      throw new Error('Insufficient permissions to delete companies')
    }

    // Check if company exists and user can access it
    const company = await getCompany(id, userId)
    if (!company) {
      throw new Error('Company not found')
    }

    // Soft delete by setting is_active = false
    const { error } = await supabase
      .from('companies')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting company:', error)
      throw new Error(`Failed to delete company: ${error.message}`)
    }

  } catch (error) {
    console.error('Company delete service error:', error)
    throw error
  }
}