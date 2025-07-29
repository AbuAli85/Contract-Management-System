import { Suspense } from 'react'


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

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  console.log('🔧 Dashboard: Rendering page', { locale })

  return (
    <div className="space-y-6">
      {/* Debug indicator */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold text-yellow-800">🔧 Dashboard Debug</h2>
        <p className="text-sm text-yellow-700">Dashboard page is rendering! Locale: {locale}</p>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your system overview.
        </p>
      </div>

      {/* Simplified content for testing */}
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



