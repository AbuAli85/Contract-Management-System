import { Suspense } from "react"

// Loading fallback
function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="mr-2 animate-spin">⏳</div> Loading dashboard...
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

  // Only log once per session to reduce console spam
  // console.log('🔧 Dashboard: Rendering page', { locale })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your system overview.</p>
      </div>

      {/* Simplified content for testing */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <a
            href={`/${locale}/generate-contract`}
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            <h3 className="font-medium">Generate Contract</h3>
            <p className="text-sm text-gray-600">Create a new contract</p>
          </a>
          <a
            href={`/${locale}/manage-promoters`}
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            <h3 className="font-medium">Manage Promoters</h3>
            <p className="text-sm text-gray-600">View and manage promoters</p>
          </a>
          <a href={`/${locale}/contracts`} className="rounded-lg border p-4 hover:bg-gray-50">
            <h3 className="font-medium">View Contracts</h3>
            <p className="text-sm text-gray-600">Browse all contracts</p>
          </a>
        </div>
      </div>
    </div>
  )
}
