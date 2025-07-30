"use client"

import { Badge } from "@/components/ui/badge"
import { Shield, User, Crown } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

interface RoleStatusIndicatorProps {
  showIcon?: boolean
  variant?: "default" | "secondary" | "outline"
  className?: string
}

export function RoleStatusIndicator({
  showIcon = true,
  variant = "outline",
  className = "",
}: RoleStatusIndicatorProps) {
  const { role } = usePermissions()

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3" />
      case "manager":
        return <Shield className="h-3 w-3" />
      case "user":
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "user":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <Badge variant={variant} className={`${getRoleColor(role)} ${className}`}>
      {showIcon && getRoleIcon(role)}
      <span className="ml-1 capitalize">{role}</span>
    </Badge>
  )
}
