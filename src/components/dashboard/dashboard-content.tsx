import { 
  FileText, 
  Users2, 
  BarChart3,
  Activity 
} from 'lucide-react'
import { StatsCard } from '@/src/components/dashboard/StatsCard'
import { QuickActions } from '@/src/components/dashboard/QuickActions'
import { SystemOverview } from '@/src/components/dashboard/SystemOverview'

interface DashboardContentProps {
  locale: string
}

export default function DashboardContent({ locale }: DashboardContentProps) {
  // In a real app, these would come from your API/database
  const stats = {
    totalContracts: 130,
    activeContracts: 85,
    totalParties: 6,
    promoters: 5,
  }

  return (
    <div className="container space-y-8 py-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Contract Management System</h1>
        <p className="text-lg text-muted-foreground">
          Streamline your contract generation and management process
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Contracts"
          value={stats.totalContracts}
          description="All contracts in the system"
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Contracts"
          value={stats.activeContracts}
          description="Currently active contracts"
          icon={<Activity className="h-6 w-6 text-green-600" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Parties"
          value={stats.totalParties}
          description="Registered parties"
          icon={<Users2 className="h-6 w-6 text-purple-600" />}
        />
        <StatsCard
          title="Promoters"
          value={stats.promoters}
          description="Active promoters"
          icon={<BarChart3 className="h-6 w-6 text-orange-600" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* System Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">System Overview</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <SystemOverview />
        </div>
      </div>
    </div>
  )
}
