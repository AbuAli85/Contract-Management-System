'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Eye, Download, Share2, Edit, FileText } from 'lucide-react'

interface ContractPreviewProps {
  contractData?: any
  onEdit?: () => void
  onDownload?: () => void
  onShare?: () => void
}

export function ContractPreview({ 
  contractData, 
  onEdit, 
  onDownload, 
  onShare 
}: ContractPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'SAR') => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getContractStatus = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', variant: 'secondary' as const }
      case 'pending':
        return { label: 'Pending Review', variant: 'default' as const }
      case 'approved':
        return { label: 'Approved', variant: 'default' as const }
      case 'active':
        return { label: 'Active', variant: 'default' as const }
      case 'completed':
        return { label: 'Completed', variant: 'default' as const }
      case 'terminated':
        return { label: 'Terminated', variant: 'destructive' as const }
      default:
        return { label: 'Unknown', variant: 'secondary' as const }
    }
  }

  const status = getContractStatus(contractData?.status || 'draft')

  const contractSections = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Contract ID', value: contractData?.id || 'Not assigned' },
        { label: 'Job Title', value: contractData?.job_title || 'Not specified' },
        { label: 'Department', value: contractData?.department || 'Not specified' },
        { label: 'Contract Type', value: contractData?.contract_type || 'Not specified' }
      ]
    },
    {
      title: 'Parties',
      fields: [
        { label: 'Employer', value: contractData?.employer_name || 'Not specified' },
        { label: 'Promoter', value: contractData?.promoter_name || 'Not specified' }
      ]
    },
    {
      title: 'Terms',
      fields: [
        { label: 'Start Date', value: formatDate(contractData?.start_date) },
        { label: 'End Date', value: formatDate(contractData?.end_date) },
        { label: 'Work Location', value: contractData?.work_location || 'Not specified' },
        { label: 'Salary', value: formatCurrency(contractData?.salary, contractData?.currency) }
      ]
    }
  ]

  if (!contractData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contract data available for preview</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>
              {status.label}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field, fieldIndex) => (
                <div key={field.label} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <p className="text-sm">{field.value}</p>
                </div>
              ))}
            </div>
            {sectionIndex < contractSections.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}

        {isExpanded && contractData?.description && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap">
                {contractData.description}
              </p>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-4">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 