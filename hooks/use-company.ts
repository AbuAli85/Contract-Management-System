"use client"

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CompanyCreateData, CompanyUpdateData, CompanyResponse } from '@/lib/company-service'

// Hook for company upsert functionality
export function useCompanyUpsert() {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const upsertMutation = useMutation({
    mutationFn: async (data: CompanyCreateData & { upsert_strategy?: 'email' | 'slug' }) => {
      const response = await fetch('/api/enhanced/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create/update company')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success('Company saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', data.data.id] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to save company: ${error.message}`)
    },
  })

  const upsertCompany = async (companyData: CompanyCreateData & { upsert_strategy?: 'email' | 'slug' }) => {
    setIsLoading(true)
    try {
      const result = await upsertMutation.mutateAsync(companyData)
      return result.data as CompanyResponse
    } finally {
      setIsLoading(false)
    }
  }

  return {
    upsertCompany,
    isLoading: isLoading || upsertMutation.isPending,
    error: upsertMutation.error,
    isSuccess: upsertMutation.isSuccess,
    reset: upsertMutation.reset,
  }
}

// Hook for company updates
export function useCompanyUpdate() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (data: CompanyUpdateData) => {
      const response = await fetch('/api/enhanced/companies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update company')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success('Company updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', data.data.id] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to update company: ${error.message}`)
    },
  })

  return {
    updateCompany: updateMutation.mutateAsync,
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
    isSuccess: updateMutation.isSuccess,
    reset: updateMutation.reset,
  }
}

// Hook for company deletion
export function useCompanyDelete() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch(`/api/enhanced/companies?id=${companyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete company')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Company deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete company: ${error.message}`)
    },
  })

  return {
    deleteCompany: deleteMutation.mutateAsync,
    isLoading: deleteMutation.isPending,
    error: deleteMutation.error,
    isSuccess: deleteMutation.isSuccess,
  }
}

// Hook for fetching companies list
export function useCompanies(options: {
  page?: number
  limit?: number
  search?: string
  business_type?: string
  is_active?: boolean
  is_verified?: boolean
} = {}) {
  const queryKey = ['companies', options]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      
      if (options.page) searchParams.set('page', options.page.toString())
      if (options.limit) searchParams.set('limit', options.limit.toString())
      if (options.search) searchParams.set('search', options.search)
      if (options.business_type) searchParams.set('business_type', options.business_type)
      if (options.is_active !== undefined) searchParams.set('is_active', options.is_active.toString())
      if (options.is_verified !== undefined) searchParams.set('is_verified', options.is_verified.toString())

      const response = await fetch(`/api/enhanced/companies?${searchParams.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch companies')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  return {
    companies: query.data?.data || [],
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    limit: query.data?.limit || 20,
    pages: query.data?.pages || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

// Hook for fetching a single company
export function useCompany(companyId: string | null) {
  const query = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null

      const response = await fetch(`/api/enhanced/companies/${companyId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch company')
      }

      return response.json()
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    company: query.data?.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

// Utility hook for company form management
export function useCompanyForm() {
  const [formData, setFormData] = useState<Partial<CompanyCreateData>>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    business_type: 'small_business',
    address: {},
    settings: {}
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: keyof CompanyCreateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generateSlugFromName = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

    updateField('slug', slug)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Company name is required'
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Company slug is required'
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be lowercase, alphanumeric, and hyphen-separated'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      email: '',
      phone: '',
      website: '',
      description: '',
      business_type: 'small_business',
      address: {},
      settings: {}
    })
    setErrors({})
  }

  const loadCompany = (company: CompanyResponse) => {
    setFormData({
      name: company.name,
      slug: company.slug,
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      description: company.description || '',
      business_type: company.business_type as any,
      address: company.address || {},
      settings: company.settings || {}
    })
    setErrors({})
  }

  return {
    formData,
    errors,
    updateField,
    generateSlugFromName,
    validateForm,
    resetForm,
    loadCompany,
    isValid: Object.keys(errors).length === 0 && !!formData.name && !!formData.slug
  }
}