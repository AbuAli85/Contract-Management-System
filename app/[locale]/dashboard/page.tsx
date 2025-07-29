'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/src/components/auth/simple-auth-provider'


// Loading fallback
function DashboardLoading() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin mr-2">⏳</div> Loading dashboard...
    </div>
  )
}

interface DashboardStats {
  totalContracts: number
  activeContracts: number
  pendingContracts: number
  totalPromoters: number
  totalParties: number
  pendingApprovals: number
  systemHealth: number
  recentActivity: number
}

export default function DashboardPage() {
  const { user, loading: authLoading, profile, mounted } = useAuth()
  const [dataLoading, setDataLoading] = useState(false)
  
  // Get params using useParams for Next.js compatibility
  const params = useParams()
  const locale = params.locale as string
  
  // Debug logging
  console.log('🔧 Dashboard: Component rendered', { 
    user: !!user, 
    authLoading, 
    mounted, 
    profile: !!profile,
    dataLoading,
    locale
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email}. Here's your system overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Contracts</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Contracts</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Promoters</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href={`/${locale}/generate-contract`} className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-medium">Generate Contract</h3>
            <p className="text-sm text-gray-600">Create a new contract</p>
          </a>
          <a href={`/${locale}/manage-promoters`} className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-medium">Manage Promoters</h3>
            <p className="text-sm text-gray-600">View and manage promoters</p>
          </a>
          <a href={`/${locale}/contracts`} className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-medium">View Contracts</h3>
            <p className="text-sm text-gray-600">Browse all contracts</p>
          </a>
        </div>
      </div>
    </div>
  )
}



// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic'