"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus,
  Settings,
  Download,
  Calendar,
  Filter,
  BarChart3,
  FileText,
  Building2,
  Clock,
  Users,
  TrendingUp,
  Save,
  Play,
  Copy,
  Trash2,
  Edit,
  Eye
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import { 
  ReportService, 
  type ReportConfig, 
  type ReportType, 
  type ReportFormat, 
  type ReportPeriod,
  type ReportFilters
} from '@/lib/report-service'

interface ReportBuilderProps {
  onReportGenerated?: (reportId: string, downloadUrl: string) => void
  onError?: (error: string) => void
  userRole?: 'admin' | 'company' | 'user'
  companyId?: string
}

const REPORT_TYPES: Array<{
  value: ReportType
  label: string
  description: string
  icon: React.ReactNode
  requiredRole?: 'admin' | 'company'
}> = [
  {
    value: 'company_overview',
    label: 'Company Overview',
    description: 'Comprehensive company profile with documents and contracts',
    icon: <Building2 className="h-5 w-5" />,
    requiredRole: 'company'
  },
  {
    value: 'document_compliance',
    label: 'Document Compliance',
    description: 'Compliance status across all companies',
    icon: <FileText className="h-5 w-5" />,
    requiredRole: 'admin'
  },
  {
    value: 'expiry_analysis',
    label: 'Expiry Analysis',
    description: 'Document expiry tracking and forecasting',
    icon: <Clock className="h-5 w-5" />
  },
  {
    value: 'activity_summary',
    label: 'Activity Summary',
    description: 'System activity and usage analytics',
    icon: <TrendingUp className="h-5 w-5" />,
    requiredRole: 'admin'
  },
  {
    value: 'financial_summary',
    label: 'Financial Summary',
    description: 'Contract values and financial analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    requiredRole: 'admin'
  },
  {
    value: 'custom',
    label: 'Custom Report',
    description: 'Build a custom report with specific criteria',
    icon: <Settings className="h-5 w-5" />
  }
]

const REPORT_FORMATS: Array<{
  value: ReportFormat
  label: string
  description: string
}> = [
  { value: 'pdf', label: 'PDF', description: 'Formatted document for printing' },
  { value: 'excel', label: 'Excel', description: 'Spreadsheet for analysis' },
  { value: 'csv', label: 'CSV', description: 'Raw data for import' },
  { value: 'json', label: 'JSON', description: 'Structured data for developers' }
]

const REPORT_PERIODS: Array<{
  value: ReportPeriod
  label: string
}> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Date Range' }
]

export function ReportBuilder({
  onReportGenerated,
  onError,
  userRole = 'company',
  companyId
}: ReportBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [reportConfig, setReportConfig] = useState<Partial<ReportConfig>>({
    name: '',
    type: 'company_overview',
    format: 'pdf',
    period: 'monthly',
    includeCharts: true,
    includeDetails: true,
    filters: {}
  })
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null)

  // Filter report types based on user role
  const availableReportTypes = REPORT_TYPES.filter(type => 
    !type.requiredRole || 
    type.requiredRole === userRole || 
    userRole === 'admin'
  )

  useEffect(() => {
    loadSavedReports()
  }, [])

  const loadSavedReports = async () => {
    try {
      const result = await ReportService.getReportConfigs()
      if (result.data) {
        setSavedReports(result.data)
      }
    } catch (error) {
      console.error('Failed to load saved reports:', error)
    }
  }

  const handleConfigChange = (field: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value
      }
    }))
  }

  const validateConfig = (): boolean => {
    if (!reportConfig.name?.trim()) {
      onError?.('Report name is required')
      return false
    }

    if (!reportConfig.type) {
      onError?.('Report type is required')
      return false
    }

    if (reportConfig.type === 'company_overview' && !companyId) {
      onError?.('Company ID is required for company overview reports')
      return false
    }

    if (reportConfig.period === 'custom' && !reportConfig.customDateRange) {
      onError?.('Custom date range is required')
      return false
    }

    return true
  }

  const generateReport = async () => {
    if (!validateConfig()) return

    setIsGenerating(true)
    
    try {
      let reportData
      
      switch (reportConfig.type) {
        case 'company_overview':
          if (!companyId) throw new Error('Company ID required')
          const companyResult = await ReportService.generateCompanyOverviewReport(companyId, reportConfig)
          if (companyResult.error) throw new Error(companyResult.error)
          reportData = companyResult.data
          break
          
        case 'document_compliance':
          const complianceResult = await ReportService.generateDocumentComplianceReport(reportConfig.filters)
          if (complianceResult.error) throw new Error(complianceResult.error)
          reportData = complianceResult.data
          break
          
        case 'expiry_analysis':
          const expiryResult = await ReportService.generateExpiryAnalysisReport(reportConfig.filters)
          if (expiryResult.error) throw new Error(expiryResult.error)
          reportData = expiryResult.data
          break
          
        case 'activity_summary':
          const activityResult = await ReportService.generateActivitySummaryReport(reportConfig.filters!)
          if (activityResult.error) throw new Error(activityResult.error)
          reportData = activityResult.data
          break
          
        default:
          throw new Error(`Report type ${reportConfig.type} not yet implemented`)
      }

      // Export report in selected format
      const exportResult = await ReportService.exportReport(
        reportData,
        reportConfig.format!,
        reportConfig.name!
      )

      if (!exportResult.success) {
        throw new Error(exportResult.error || 'Failed to export report')
      }

      if (exportResult.downloadUrl) {
        onReportGenerated?.(
          `report-${Date.now()}`,
          exportResult.downloadUrl
        )
      }

    } catch (error) {
      console.error('Error generating report:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveReportConfig = async () => {
    if (!validateConfig()) return

    try {
      const result = await ReportService.saveReportConfig(reportConfig as ReportConfig)
      if (result.error) {
        throw new Error(result.error)
      }

      await loadSavedReports()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving report config:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to save report configuration')
    }
  }

  const loadReportConfig = (config: ReportConfig) => {
    setReportConfig(config)
    setCurrentStep(1)
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Report Type & Basic Settings'
      case 2: return 'Filters & Criteria'
      case 3: return 'Format & Export Options'
      case 4: return 'Review & Generate'
      default: return 'Report Builder'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Builder</h1>
          <p className="text-muted-foreground">
            Create comprehensive reports and analytics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Saved Reports
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Saved Report Configurations</DialogTitle>
                <DialogDescription>
                  Manage and reuse your saved report configurations
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {savedReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Saved Reports</h3>
                    <p className="text-muted-foreground">
                      Create and save report configurations to reuse them later
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedReports.map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{report.name}</CardTitle>
                              <CardDescription>{report.description}</CardDescription>
                            </div>
                            <Badge variant="outline">{report.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Format: {report.format} • Period: {report.period}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  loadReportConfig(report)
                                  setIsDialogOpen(false)
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(report)
                                  generateReport()
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Run
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`flex items-center ${
              step < 4 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-muted-foreground text-muted-foreground'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle(currentStep)}</CardTitle>
          <CardDescription>
            Step {currentStep} of 4
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Report Type & Basic Settings */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="reportName">Report Name *</Label>
                <Input
                  id="reportName"
                  placeholder="Enter report name"
                  value={reportConfig.name || ''}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  placeholder="Describe what this report covers"
                  value={reportConfig.description || ''}
                  onChange={(e) => handleConfigChange('description', e.target.value)}
                />
              </div>

              <div>
                <Label>Report Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {availableReportTypes.map((type) => (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        reportConfig.type === type.value
                          ? 'ring-2 ring-primary bg-primary/5'
                          : ''
                      }`}
                      onClick={() => handleConfigChange('type', type.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {type.icon}
                          <div>
                            <h4 className="font-semibold text-sm">{type.label}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {type.description}
                            </p>
                            {type.requiredRole && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {type.requiredRole}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label>Report Period</Label>
                <Select
                  value={reportConfig.period}
                  onValueChange={(value: ReportPeriod) => handleConfigChange('period', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reportConfig.period === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      onChange={(e) => handleConfigChange('customDateRange', {
                        ...reportConfig.customDateRange,
                        startDate: new Date(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      onChange={(e) => handleConfigChange('customDateRange', {
                        ...reportConfig.customDateRange,
                        endDate: new Date(e.target.value)
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Filters & Criteria */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Filter Criteria</h3>
                
                {(reportConfig.type === 'document_compliance' || 
                  reportConfig.type === 'expiry_analysis' ||
                  reportConfig.type === 'activity_summary') && (
                  <div className="space-y-4">
                    <div>
                      <Label>Document Types</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {['commercial_registration', 'business_license', 'tax_certificate', 'insurance', 'logo', 'other'].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={reportConfig.filters?.documentTypes?.includes(type)}
                              onCheckedChange={(checked) => {
                                const current = reportConfig.filters?.documentTypes || []
                                const updated = checked
                                  ? [...current, type]
                                  : current.filter(t => t !== type)
                                handleFilterChange('documentTypes', updated)
                              }}
                            />
                            <Label htmlFor={type} className="text-sm capitalize">
                              {type.replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Status Filters</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeExpired"
                            checked={reportConfig.filters?.includeExpired}
                            onCheckedChange={(checked) => handleFilterChange('includeExpired', checked)}
                          />
                          <Label htmlFor="includeExpired" className="text-sm">
                            Include Expired
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeExpiring"
                            checked={reportConfig.filters?.includeExpiring}
                            onCheckedChange={(checked) => handleFilterChange('includeExpiring', checked)}
                          />
                          <Label htmlFor="includeExpiring" className="text-sm">
                            Include Expiring
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {reportConfig.type === 'financial_summary' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Amount</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={reportConfig.filters?.minAmount || ''}
                        onChange={(e) => handleFilterChange('minAmount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Maximum Amount</Label>
                      <Input
                        type="number"
                        placeholder="No limit"
                        value={reportConfig.filters?.maxAmount || ''}
                        onChange={(e) => handleFilterChange('maxAmount', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Format & Export Options */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label>Export Format</Label>
                <RadioGroup
                  value={reportConfig.format}
                  onValueChange={(value: ReportFormat) => handleConfigChange('format', value)}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2"
                >
                  {REPORT_FORMATS.map((format) => (
                    <div key={format.value}>
                      <RadioGroupItem
                        value={format.value}
                        id={format.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={format.value}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <div className="text-center">
                          <div className="font-semibold">{format.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format.description}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Report Options</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={reportConfig.includeCharts}
                    onCheckedChange={(checked) => handleConfigChange('includeCharts', checked)}
                  />
                  <Label htmlFor="includeCharts">
                    Include Charts and Visualizations
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={reportConfig.includeDetails}
                    onCheckedChange={(checked) => handleConfigChange('includeDetails', checked)}
                  />
                  <Label htmlFor="includeDetails">
                    Include Detailed Data Tables
                  </Label>
                </div>
              </div>

              <div>
                <Label>Email Recipients (Optional)</Label>
                <Textarea
                  placeholder="Enter email addresses separated by commas"
                  value={reportConfig.recipients?.join(', ') || ''}
                  onChange={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                    handleConfigChange('recipients', emails)
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Generate */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Report Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Name:</span>
                      <span className="ml-2">{reportConfig.name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2 capitalize">
                        {reportConfig.type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Period:</span>
                      <span className="ml-2 capitalize">{reportConfig.period}</span>
                    </div>
                    <div>
                      <span className="font-medium">Format:</span>
                      <span className="ml-2 uppercase">{reportConfig.format}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Include Charts:</span>
                      <span className="ml-2">{reportConfig.includeCharts ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Include Details:</span>
                      <span className="ml-2">{reportConfig.includeDetails ? 'Yes' : 'No'}</span>
                    </div>
                    {reportConfig.recipients?.length && (
                      <div>
                        <span className="font-medium">Recipients:</span>
                        <span className="ml-2">{reportConfig.recipients.length} email(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                {reportConfig.description && (
                  <div className="mt-4">
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-muted-foreground">{reportConfig.description}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate & Download
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={saveReportConfig}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Config
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
          >
            Next
          </Button>
        ) : (
          <div /> // Empty div to maintain layout
        )}
      </div>
    </div>
  )
}
