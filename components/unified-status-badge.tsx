import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Archive,
  HelpCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, parseISO } from "date-fns"

// Document Status Types
export type DocumentStatus = "valid" | "expiring_soon" | "expired" | "missing"

// Contract Status Types
export type ContractStatusValue =
  | "draft"
  | "pending_review"
  | "active"
  | "expired"
  | "terminated"
  | "suspended"
  | "archived"
  | "unknown"

// Unified Status Configuration
export interface StatusConfig {
  value: string
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string }>
  priority: number
}

// Document Status Configurations
const documentStatusConfigs: Record<DocumentStatus, StatusConfig> = {
  valid: {
    value: "valid",
    label: "Valid",
    description: "Document is valid and up to date",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
    priority: 1,
  },
  expiring_soon: {
    value: "expiring_soon",
    label: "Expiring Soon",
    description: "Document will expire within 30 days",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertTriangle,
    priority: 2,
  },
  expired: {
    value: "expired",
    label: "Expired",
    description: "Document has expired and needs renewal",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    priority: 3,
  },
  missing: {
    value: "missing",
    label: "Missing",
    description: "Document is not available",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: HelpCircle,
    priority: 4,
  },
}

// Contract Status Configurations
const contractStatusConfigs: Record<ContractStatusValue, StatusConfig> = {
  draft: {
    value: "draft",
    label: "Draft",
    description: "Contract is being prepared",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: FileText,
    priority: 1,
  },
  pending_review: {
    value: "pending_review",
    label: "Pending Review",
    description: "Awaiting review and approval",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    priority: 2,
  },
  active: {
    value: "active",
    label: "Active",
    description: "Contract is currently active",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
    priority: 3,
  },
  expired: {
    value: "expired",
    label: "Expired",
    description: "Contract has expired",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    priority: 4,
  },
  terminated: {
    value: "terminated",
    label: "Terminated",
    description: "Contract was terminated early",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    priority: 5,
  },
  suspended: {
    value: "suspended",
    label: "Suspended",
    description: "Contract is temporarily suspended",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    priority: 6,
  },
  archived: {
    value: "archived",
    label: "Archived",
    description: "Contract has been archived",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: Archive,
    priority: 7,
  },
  unknown: {
    value: "unknown",
    label: "Unknown",
    description: "Status is not determined",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: AlertTriangle,
    priority: 8,
  },
}

// Helper functions
export function getDocumentStatus(status: DocumentStatus): StatusConfig {
  return documentStatusConfigs[status]
}

export function getContractStatus(status: string): StatusConfig {
  const contractStatus = status as ContractStatusValue
  return contractStatusConfigs[contractStatus] || contractStatusConfigs.unknown
}

// Main component props
interface UnifiedStatusBadgeProps {
  /** Type of status badge */
  type: "document" | "contract"
  /** Status value */
  status: string
  /** Custom label (for document badges) */
  label?: string
  /** Expiry date (for document badges) */
  expiryDate?: string | null
  /** Show icon */
  showIcon?: boolean
  /** Show tooltip */
  showTooltip?: boolean
  /** Badge size */
  size?: "sm" | "default" | "lg"
  /** Additional CSS classes */
  className?: string
}

export function UnifiedStatusBadge({
  type,
  status,
  label,
  expiryDate,
  showIcon = true,
  showTooltip = true,
  size = "default",
  className,
}: UnifiedStatusBadgeProps) {
  // Get status configuration based on type
  const statusConfig =
    type === "document" ? getDocumentStatus(status as DocumentStatus) : getContractStatus(status)

  const Icon = statusConfig.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2",
  }

  // For document badges, we need a different layout
  if (type === "document") {
    const documentBadge = (
      <div
        className={cn(
          "flex items-center space-x-2 rounded-md border p-2",
          statusConfig.color,
          className,
        )}
      >
        <Icon className="h-5 w-5" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{label || statusConfig.label}</span>
          <span className="text-xs">
            {statusConfig.label}
            {expiryDate && ` (Expires: ${format(parseISO(expiryDate), "PPP")})`}
          </span>
        </div>
      </div>
    )

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{documentBadge}</TooltipTrigger>
            <TooltipContent>
              <p>{statusConfig.description}</p>
              {expiryDate && (
                <p className="text-xs text-gray-500">
                  Expires: {format(parseISO(expiryDate), "PPP")}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return documentBadge
  }

  // For contract badges, use the standard badge layout
  const contractBadge = (
    <Badge
      variant="outline"
      className={cn(
        statusConfig.color,
        sizeClasses[size],
        "inline-flex items-center gap-1.5 font-medium",
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {statusConfig.label}
    </Badge>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{contractBadge}</TooltipTrigger>
          <TooltipContent>
            <p>{statusConfig.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return contractBadge
}

// Status Filter Component
interface StatusFilterProps {
  type: "document" | "contract"
  currentStatus: string
  onStatusChange: (status: string) => void
}

export function StatusFilter({ type, currentStatus, onStatusChange }: StatusFilterProps) {
  const statuses =
    type === "document"
      ? Object.values(documentStatusConfigs)
      : Object.values(contractStatusConfigs)

  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value)}
      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={`Filter by ${type} status`}
    >
      <option value="">All Statuses</option>
      {statuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  )
}

// Export all status configurations for external use
export const DOCUMENT_STATUSES = Object.values(documentStatusConfigs)
export const CONTRACT_STATUSES = Object.values(contractStatusConfigs)

// Legacy exports for backward compatibility
export { UnifiedStatusBadge as DocumentStatusBadge }
export { UnifiedStatusBadge as EnhancedStatusBadge }
