// components/contract-export-error.tsx
// Component to display structured contract export errors

"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  RefreshCw,
  FileText,
  Settings,
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

// Error codes from the Edge Function
export enum ExportErrorCode {
  INVALID_CONTRACT_ID = "INVALID_CONTRACT_ID",
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_CONTRACT_TYPE = "INVALID_CONTRACT_TYPE",
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  TEMPLATE_ACCESS_DENIED = "TEMPLATE_ACCESS_DENIED",
  TEMPLATE_PARSE_ERROR = "TEMPLATE_PARSE_ERROR",
  DATA_MAPPING_FAILED = "DATA_MAPPING_FAILED",
  UNMAPPED_FIELDS = "UNMAPPED_FIELDS",
  MISSING_PLACEHOLDERS = "MISSING_PLACEHOLDERS",
  PDF_GENERATION_FAILED = "PDF_GENERATION_FAILED",
  PUPPETEER_ERROR = "PUPPETEER_ERROR",
  STORAGE_UPLOAD_FAILED = "STORAGE_UPLOAD_FAILED",
  GOOGLE_DOCS_ERROR = "GOOGLE_DOCS_ERROR",
  MAKECOM_ERROR = "MAKECOM_ERROR",
  WEBHOOK_ERROR = "WEBHOOK_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
}

export interface ExportError {
  code: ExportErrorCode
  message: string
  details?: Record<string, any>
  actionable?: boolean
  retryable?: boolean
  suggestions?: string[]
}

interface ContractExportErrorProps {
  error: ExportError
  onRetry?: () => void
  onFixData?: () => void
  onContactSupport?: () => void
  contractId?: string
  contractNumber?: string
}

export function ContractExportError({
  error,
  onRetry,
  onFixData,
  onContactSupport,
  contractId,
  contractNumber,
}: ContractExportErrorProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getErrorIcon = (code: ExportErrorCode) => {
    switch (code) {
      case ExportErrorCode.MISSING_REQUIRED_FIELDS:
      case ExportErrorCode.UNMAPPED_FIELDS:
      case ExportErrorCode.MISSING_PLACEHOLDERS:
        return <Settings className="h-5 w-5" />
      case ExportErrorCode.TEMPLATE_NOT_FOUND:
      case ExportErrorCode.TEMPLATE_ACCESS_DENIED:
        return <FileText className="h-5 w-5" />
      case ExportErrorCode.PDF_GENERATION_FAILED:
      case ExportErrorCode.PUPPETEER_ERROR:
        return <AlertTriangle className="h-5 w-5" />
      case ExportErrorCode.RATE_LIMIT_ERROR:
        return <Clock className="h-5 w-5" />
      case ExportErrorCode.TIMEOUT_ERROR:
        return <Clock className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getErrorSeverity = (code: ExportErrorCode): "low" | "medium" | "high" => {
    switch (code) {
      case ExportErrorCode.MISSING_REQUIRED_FIELDS:
      case ExportErrorCode.UNMAPPED_FIELDS:
      case ExportErrorCode.MISSING_PLACEHOLDERS:
        return "medium"
      case ExportErrorCode.TEMPLATE_NOT_FOUND:
      case ExportErrorCode.TEMPLATE_ACCESS_DENIED:
      case ExportErrorCode.PERMISSION_DENIED:
        return "high"
      case ExportErrorCode.PDF_GENERATION_FAILED:
      case ExportErrorCode.PUPPETEER_ERROR:
      case ExportErrorCode.STORAGE_UPLOAD_FAILED:
        return "medium"
      case ExportErrorCode.RATE_LIMIT_ERROR:
      case ExportErrorCode.TIMEOUT_ERROR:
        return "low"
      default:
        return "medium"
    }
  }

  const getErrorVariant = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "low":
        return "default"
      case "medium":
        return "destructive"
      case "high":
        return "destructive"
    }
  }

  const severity = getErrorSeverity(error.code)
  const variant = getErrorVariant(severity)

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getErrorIcon(error.code)}
          <div className="flex-1">
            <CardTitle className="text-lg">Export Failed</CardTitle>
            <CardDescription>Contract: {contractNumber || contractId || "Unknown"}</CardDescription>
          </div>
          <Badge variant={variant}>
            {severity === "high" ? "Critical" : severity === "medium" ? "Warning" : "Info"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        <Alert variant={variant}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error.message}</AlertDescription>
        </Alert>

        {/* Error Code */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Error Code:</span>
          <Badge variant="outline" className="font-mono text-xs">
            {error.code}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {error.retryable && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Export
            </Button>
          )}

          {error.actionable && onFixData && (
            <Button
              onClick={onFixData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Fix Data
            </Button>
          )}

          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>

        {/* Suggestions */}
        {error.suggestions && error.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Suggested Actions:</h4>
            <ul className="space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-600" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Details */}
        {showDetails && (
          <div className="space-y-3">
            <Separator />
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Technical Details:</h4>
              <div className="rounded-md bg-muted p-3">
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Support Contact */}
        <div className="border-t pt-2">
          <p className="mb-2 text-xs text-muted-foreground">
            Still having issues? Contact support for assistance.
          </p>
          <Button onClick={onContactSupport} variant="ghost" size="sm" className="text-xs">
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Error summary component for lists
export function ContractExportErrorSummary({ error }: { error: ExportError }) {
  const getErrorColor = (code: ExportErrorCode) => {
    switch (code) {
      case ExportErrorCode.MISSING_REQUIRED_FIELDS:
      case ExportErrorCode.UNMAPPED_FIELDS:
        return "text-orange-600"
      case ExportErrorCode.TEMPLATE_NOT_FOUND:
      case ExportErrorCode.PERMISSION_DENIED:
        return "text-red-600"
      case ExportErrorCode.RATE_LIMIT_ERROR:
      case ExportErrorCode.TIMEOUT_ERROR:
        return "text-blue-600"
      default:
        return "text-red-600"
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <XCircle className={`h-4 w-4 ${getErrorColor(error.code)}`} />
      <span className={getErrorColor(error.code)}>{error.message}</span>
      <Badge variant="outline" className="text-xs">
        {error.code}
      </Badge>
    </div>
  )
}

// Error toast component
export function ContractExportErrorToast({ error }: { error: ExportError }) {
  return (
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
      <div className="flex-1">
        <p className="text-sm font-medium">Export Failed</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        {error.suggestions && error.suggestions.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">{error.suggestions[0]}</p>
        )}
      </div>
    </div>
  )
}
