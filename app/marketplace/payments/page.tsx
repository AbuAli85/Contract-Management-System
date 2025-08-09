"use client"

import { PaymentEscrowSystem } from '@/components/marketplace/payment-escrow-system'
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider'

export default function PaymentsPage() {
  const { user, loading } = useEnhancedRBAC()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to access payment management.</p>
      </div>
    )
  }

  // Determine user role based on user data
  const userRole = user?.role === 'provider' ? 'provider' : 'client'

  return (
    <PaymentEscrowSystem 
      userRole={userRole}
      userId={user?.id || ''}
    />
  )
}