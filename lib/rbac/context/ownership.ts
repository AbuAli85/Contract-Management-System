// ========================================
// 🛡️ RBAC OWNERSHIP CONTEXT EVALUATOR
// ========================================

import { createClient } from '@/lib/supabase/server'

export interface OwnershipContext {
  user: {
    id: string
    email?: string
    provider_id?: string
    organization_id?: string
  }
  params: Record<string, any>
  resourceType: string
  resourceId?: string
}

export interface OwnershipResult {
  isOwner: boolean
  reason?: string
  context?: Record<string, any>
}

export class OwnershipEvaluator {
  private supabase: any = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    try {
      this.supabase = await createClient()
    } catch (error) {
      console.error('🔐 RBAC: Failed to initialize Supabase for ownership evaluation:', error)
    }
  }

  /**
   * Check if user owns a resource
   */
  async checkOwnership(
    resource: string,
    context: OwnershipContext
  ): Promise<OwnershipResult> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { resourceType, resourceId, user } = context

      switch (resourceType) {
        case 'user':
          return this.checkUserOwnership(context)
        
        case 'profile':
          return this.checkProfileOwnership(context)
        
        case 'service':
          return this.checkServiceOwnership(context)
        
        case 'booking':
          return this.checkBookingOwnership(context)
        
        case 'contract':
          return this.checkContractOwnership(context)
        
        case 'company':
          return this.checkCompanyOwnership(context)
        
        case 'promoter':
          return this.checkPromoterOwnership(context)
        
        case 'party':
          return this.checkPartyOwnership(context)
        
        default:
          return {
            isOwner: false,
            reason: `Unknown resource type: ${resourceType}`
          }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking ownership'
      }
    }
  }

  /**
   * Check if user owns their own profile
   */
  private async checkUserOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    const { user, params } = context
    const targetUserId = params.id || params.userId

    if (!targetUserId) {
      return {
        isOwner: false,
        reason: 'No target user ID provided'
      }
    }

    const isOwner = user.id === targetUserId
    return {
      isOwner,
      reason: isOwner ? 'User owns this profile' : 'User does not own this profile',
      context: { targetUserId, userId: user.id }
    }
  }

  /**
   * Check if user owns their profile
   */
  private async checkProfileOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    return this.checkUserOwnership(context)
  }

  /**
   * Check if user owns a service
   */
  private async checkServiceOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!resourceId) {
      return {
        isOwner: false,
        reason: 'No service ID provided'
      }
    }

    try {
      const { data: service, error } = await this.supabase
        .from('services')
        .select('provider_id')
        .eq('id', resourceId)
        .single()

      if (error || !service) {
        return {
          isOwner: false,
          reason: 'Service not found'
        }
      }

      const isOwner = service.provider_id === user.id
      return {
        isOwner,
        reason: isOwner ? 'User owns this service' : 'User does not own this service',
        context: { serviceId: resourceId, providerId: service.provider_id, userId: user.id }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking service ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking service ownership'
      }
    }
  }

  /**
   * Check if user owns a booking
   */
  private async checkBookingOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!resourceId) {
      return {
        isOwner: false,
        reason: 'No booking ID provided'
      }
    }

    try {
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .select('client_user_id, provider_id')
        .eq('id', resourceId)
        .single()

      if (error || !booking) {
        return {
          isOwner: false,
          reason: 'Booking not found'
        }
      }

      const isOwner = booking.client_user_id === user.id || booking.provider_id === user.id
      return {
        isOwner,
        reason: isOwner ? 'User owns this booking' : 'User does not own this booking',
        context: { 
          bookingId: resourceId, 
          clientUserId: booking.client_user_id, 
          providerId: booking.provider_id, 
          userId: user.id 
        }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking booking ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking booking ownership'
      }
    }
  }

  /**
   * Check if user owns a contract
   */
  private async checkContractOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!resourceId) {
      return {
        isOwner: false,
        reason: 'No contract ID provided'
      }
    }

    try {
      const { data: contract, error } = await this.supabase
        .from('contracts')
        .select('user_id, promoter_id')
        .eq('id', resourceId)
        .single()

      if (error || !contract) {
        return {
          isOwner: false,
          reason: 'Contract not found'
        }
      }

      const isOwner = contract.user_id === user.id || contract.promoter_id === user.id
      return {
        isOwner,
        reason: isOwner ? 'User owns this contract' : 'User does not own this contract',
        context: { 
          contractId: resourceId, 
          userId: contract.user_id, 
          promoterId: contract.promoter_id, 
          currentUserId: user.id 
        }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking contract ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking contract ownership'
      }
    }
  }

  /**
   * Check if user owns a company
   */
  private async checkCompanyOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!resourceId) {
      return {
        isOwner: false,
        reason: 'No company ID provided'
      }
    }

    try {
      const { data: company, error } = await this.supabase
        .from('companies')
        .select('owner_id')
        .eq('id', resourceId)
        .single()

      if (error || !company) {
        return {
          isOwner: false,
          reason: 'Company not found'
        }
      }

      const isOwner = company.owner_id === user.id
      return {
        isOwner,
        reason: isOwner ? 'User owns this company' : 'User does not own this company',
        context: { companyId: resourceId, ownerId: company.owner_id, userId: user.id }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking company ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking company ownership'
      }
    }
  }

  /**
   * Check if user owns a promoter profile
   */
  private async checkPromoterOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!resourceId) {
      return {
        isOwner: false,
        reason: 'No promoter ID provided'
      }
    }

    try {
      const { data: promoter, error } = await this.supabase
        .from('promoters')
        .select('user_id')
        .eq('id', resourceId)
        .single()

      if (error || !promoter) {
        return {
          isOwner: false,
          reason: 'Promoter not found'
        }
      }

      const isOwner = promoter.user_id === user.id
      return {
        isOwner,
        reason: isOwner ? 'User owns this promoter profile' : 'User does not own this promoter profile',
        context: { promoterId: resourceId, promoterUserId: promoter.user_id, userId: user.id }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking promoter ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking promoter ownership'
      }
    }
  }

  /**
   * Check if user owns a party
   */
  private async checkPartyOwnership(context: OwnershipContext): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!resourceId) {
      return {
        isOwner: false,
        reason: 'No party ID provided'
      }
    }

    try {
      const { data: party, error } = await this.supabase
        .from('parties')
        .select('created_by')
        .eq('id', resourceId)
        .single()

      if (error || !party) {
        return {
          isOwner: false,
          reason: 'Party not found'
        }
      }

      const isOwner = party.created_by === user.id
      return {
        isOwner,
        reason: isOwner ? 'User owns this party' : 'User does not own this party',
        context: { partyId: resourceId, createdBy: party.created_by, userId: user.id }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking party ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking party ownership'
      }
    }
  }

  /**
   * Check if user has ownership through organization membership
   */
  async checkOrganizationOwnership(
    resource: string,
    context: OwnershipContext
  ): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!user.organization_id || !resourceId) {
      return {
        isOwner: false,
        reason: 'User not in organization or no resource ID'
      }
    }

    try {
      // Check if resource belongs to user's organization
      const { data: resourceData, error } = await this.supabase
        .from(resource)
        .select('organization_id')
        .eq('id', resourceId)
        .single()

      if (error || !resourceData) {
        return {
          isOwner: false,
          reason: 'Resource not found'
        }
      }

      const isOwner = resourceData.organization_id === user.organization_id
      return {
        isOwner,
        reason: isOwner ? 'User in same organization' : 'User not in same organization',
        context: { 
          resourceId, 
          resourceOrgId: resourceData.organization_id, 
          userOrgId: user.organization_id 
        }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking organization ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking organization ownership'
      }
    }
  }

  /**
   * Check if user has ownership through provider relationship
   */
  async checkProviderOwnership(
    resource: string,
    context: OwnershipContext
  ): Promise<OwnershipResult> {
    const { user, resourceId } = context

    if (!user.provider_id || !resourceId) {
      return {
        isOwner: false,
        reason: 'User not a provider or no resource ID'
      }
    }

    try {
      // Check if resource belongs to user's provider organization
      const { data: resourceData, error } = await this.supabase
        .from(resource)
        .select('provider_id')
        .eq('id', resourceId)
        .single()

      if (error || !resourceData) {
        return {
          isOwner: false,
          reason: 'Resource not found'
        }
      }

      const isOwner = resourceData.provider_id === user.provider_id
      return {
        isOwner,
        reason: isOwner ? 'User in same provider organization' : 'User not in same provider organization',
        context: { 
          resourceId, 
          resourceProviderId: resourceData.provider_id, 
          userProviderId: user.provider_id 
        }
      }
    } catch (error) {
      console.error('🔐 RBAC: Error checking provider ownership:', error)
      return {
        isOwner: false,
        reason: 'Error checking provider ownership'
      }
    }
  }
}

// Export singleton instance
export const ownershipEvaluator = new OwnershipEvaluator()



// Simple function for direct import
export async function checkOwnership(
  resource: string,
  context: OwnershipContext
): Promise<boolean> {
  const result = await ownershipEvaluator.checkOwnership(resource, context)
  return result.isOwner
}
