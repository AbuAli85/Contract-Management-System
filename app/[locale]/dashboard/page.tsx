'use client'

import { Suspense } from 'react'
import { ProfessionalLayout } from '@/components/professional-layout'
import { SystemStatus } from '@/components/system-status'
import { Loader2 } from 'lucide-react'

// Loading fallback
function DashboardLoading() {
  return (
    <ProfessionalLayout 
      title="Dashboard" 
      subtitle="System overview and performance metrics"
    >
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin mr-2" /> Loading dashboard...
      </div>
    </ProfessionalLayout>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <ProfessionalLayout 
        title="Dashboard" 
        subtitle="System overview and performance metrics"
      >
        <SystemStatus />
      </ProfessionalLayout>
    </Suspense>
  )
} 