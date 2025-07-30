"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield, AlertTriangle } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

interface PermissionWarningProps {
  requiredPermission: string
  featureName: string
  variant?: "default" | "destructive"
  className?: string
}

export function PermissionWarning({
  requiredPermission,
  featureName,
  variant = "default",
  className = "",
}: PermissionWarningProps) {
  const { can } = usePermissions()
  const hasPermission = can(requiredPermission as any)

  if (hasPermission) {
    return null
  }

  return (
    <Alert variant={variant} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Access Restricted</AlertTitle>
      <AlertDescription>
        You don't have permission to access {featureName}. Please contact your administrator if you
        believe this is an error.
      </AlertDescription>
    </Alert>
  )
}

interface PermissionGuardProps {
  permission: string
  featureName: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({
  permission,
  featureName,
  children,
  fallback,
}: PermissionGuardProps) {
  const { can } = usePermissions()
  const hasPermission = can(permission as any)

  if (!hasPermission) {
    return (
      fallback || <PermissionWarning requiredPermission={permission} featureName={featureName} />
    )
  }

  return <>{children}</>
}
