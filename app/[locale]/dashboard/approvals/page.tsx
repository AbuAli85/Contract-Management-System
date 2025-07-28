"use client"

import { Suspense } from 'react'
import { ApprovalDashboard } from '@/components/approval/ApprovalDashboard'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function ApprovalsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<LoadingSpinner />}>
        <ApprovalDashboard />
      </Suspense>
    </div>
  )
} 