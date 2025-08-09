"use client"

import { useEnhancedRBAC, RoleRedirect } from '@/components/auth/enhanced-rbac-provider'
import { ClientDashboard } from '@/components/dashboards/client-dashboard'

export default function ClientDashboardPage() {
  return (
    <RoleRedirect allowedRoles={['client', 'user', 'admin', 'super_admin']}>
      <ClientDashboard />
    </RoleRedirect>
  )
}