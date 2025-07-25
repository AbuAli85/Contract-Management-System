'use client'

import { Suspense } from 'react'
import { SystemStatus } from '@/components/system-status'
import { Loader2 } from 'lucide-react'

// Loading fallback
function DashboardLoading() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="animate-spin mr-2" /> Loading dashboard...
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and performance metrics
          </p>
        </div>
        <SystemStatus />
      </div>
    </Suspense>
  )
} 