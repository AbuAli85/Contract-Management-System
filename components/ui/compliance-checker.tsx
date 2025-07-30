"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface ComplianceCheckerProps {
  contractData?: any
  onComplianceChange?: (isCompliant: boolean, issues: string[]) => void
}

interface ComplianceIssue {
  id: string
  type: "error" | "warning" | "info"
  title: string
  description: string
  severity: "low" | "medium" | "high"
  category: string
}

export function ComplianceChecker({ contractData, onComplianceChange }: ComplianceCheckerProps) {
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [isCompliant, setIsCompliant] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const complianceRules = [
    {
      id: "salary-minimum",
      category: "Salary",
      check: (data: any) => {
        const salary = parseFloat(data?.salary || 0)
        return salary >= 3000
      },
      title: "Minimum Salary Requirement",
      description: "Salary must be at least 3,000 SAR per month",
      severity: "high" as const,
    },
    {
      id: "contract-duration",
      category: "Duration",
      check: (data: any) => {
        const startDate = new Date(data?.start_date || "")
        const endDate = new Date(data?.end_date || "")
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        return duration >= 30 && duration <= 365 * 2
      },
      title: "Contract Duration",
      description: "Contract duration should be between 30 days and 2 years",
      severity: "medium" as const,
    },
    {
      id: "work-location",
      category: "Location",
      check: (data: any) => {
        return data?.work_location && data.work_location.trim() !== ""
      },
      title: "Work Location",
      description: "Work location must be specified",
      severity: "medium" as const,
    },
    {
      id: "job-title",
      category: "Position",
      check: (data: any) => {
        return data?.job_title && data.job_title.trim() !== ""
      },
      title: "Job Title",
      description: "Job title must be specified",
      severity: "high" as const,
    },
    {
      id: "parties-defined",
      category: "Parties",
      check: (data: any) => {
        return data?.employer_id && data?.promoter_id
      },
      title: "Contracting Parties",
      description: "Both employer and promoter must be defined",
      severity: "high" as const,
    },
  ]

  const checkCompliance = (data: any) => {
    setIsLoading(true)

    const newIssues: ComplianceIssue[] = []

    complianceRules.forEach((rule) => {
      const isCompliant = rule.check(data)

      if (!isCompliant) {
        newIssues.push({
          id: rule.id,
          type: rule.severity === "high" ? "error" : "warning",
          title: rule.title,
          description: rule.description,
          severity: rule.severity,
          category: rule.category,
        })
      }
    })

    setIssues(newIssues)
    setIsCompliant(newIssues.length === 0)

    if (onComplianceChange) {
      onComplianceChange(
        newIssues.length === 0,
        newIssues.map((issue) => issue.description),
      )
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (contractData) {
      checkCompliance(contractData)
    }
  }, [contractData])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const groupedIssues = issues.reduce(
    (acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = []
      }
      acc[issue.category].push(issue)
      return acc
    },
    {} as Record<string, ComplianceIssue[]>,
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Badge variant={isCompliant ? "default" : "destructive"} className="text-sm">
                {isCompliant ? "Compliant" : "Non-Compliant"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {issues.length} issue{issues.length !== 1 ? "s" : ""} found
              </span>
            </div>

            {isCompliant ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This contract appears to be compliant with standard requirements.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedIssues).map(([category, categoryIssues]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryIssues.map((issue) => (
                        <Alert
                          key={issue.id}
                          variant={issue.type === "error" ? "destructive" : "default"}
                        >
                          <div className="flex items-start gap-2">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1">
                              <div className="font-medium">{issue.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {issue.description}
                              </div>
                            </div>
                            <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => checkCompliance(contractData)}
                disabled={isLoading}
              >
                Re-check Compliance
              </Button>

              {!isCompliant && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // This would typically open a compliance guide or help
                    console.log("Show compliance guide")
                  }}
                >
                  View Guidelines
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
