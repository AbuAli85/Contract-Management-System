"use client"

import { useFormContext } from "@/hooks/use-form-context"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AutoRefreshIndicatorProps {
  className?: string
  showIcon?: boolean
}

export function AutoRefreshIndicator({ className, showIcon = true }: AutoRefreshIndicatorProps) {
  const { isFormActive, formCount } = useFormContext()

  // Don't render during SSR or when no forms are active
  if (typeof window === "undefined" || !isFormActive) {
    return null
  }

  return (
    <Badge variant="secondary" className={cn("flex items-center gap-1 text-xs", className)}>
      {showIcon && <Clock className="h-3 w-3" />}
      <span>Auto-refresh paused</span>
      {formCount > 1 && <span className="text-muted-foreground">({formCount} forms active)</span>}
    </Badge>
  )
}

export function AutoRefreshStatus({ className }: { className?: string }) {
  const { isFormActive } = useFormContext()

  // Don't render during SSR
  if (typeof window === "undefined") {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Zap className={cn("h-4 w-4", isFormActive ? "text-muted-foreground" : "text-green-500")} />
        <span className={cn("text-sm", isFormActive ? "text-muted-foreground" : "text-green-600")}>
          {isFormActive ? "Paused" : "Active"}
        </span>
      </div>
      {isFormActive && <AutoRefreshIndicator showIcon={false} />}
    </div>
  )
}
