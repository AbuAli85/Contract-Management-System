"use client"

import { useParams, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

import { 
  ArrowLeftIcon, 
  DownloadIcon, 
  EditIcon, 
  EyeIcon, 
  SendIcon,
  UsersIcon,
  FileTextIcon,
  ClockIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  CopyIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  BellIcon,
  UserIcon
} from "lucide-react"

// Import our refactored components
import { useContract } from "@/hooks/useContract"
import { StatusBadge } from "@/components/StatusBadge"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorCard } from "@/components/ErrorCard"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { OverviewTab } from "@/components/contract-tabs/OverviewTab"
import { formatDate, calculateDuration, copyToClipboard, formatDateTime } from "@/utils/format"

interface PDFStatus {
  can_download: boolean
  has_pdf: boolean
  pdf_url?: string
  is_processing: boolean
  last_notification?: string
  notifications: any[]
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic'

export default function ContractDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'
  const contractId = (params?.id as string) || ''
  const { contract, loading, error, refetch } = useContract(contractId)
  
  // Add authentication check
  const { user, loading: authLoading } = useAuth()
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access the contract details.</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  const [pdfStatus, setPdfStatus] = useState<PDFStatus>({
    can_download: false,
    has_pdf: false,
    is_processing: false,
    notifications: []
  })
  const [downloading, setDownloading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Validate contract ID format
  const isValidContractId = contractId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractId)

  // Fetch PDF status when contract loads
  useEffect(() => {
    if (contract && contract.approval_status === 'active') {
      fetchPDFStatus()
    }
  }, [contract])

  const fetchPDFStatus = async () => {
    if (!contractId) return
    
    try {
      const response = await fetch(`/api/contracts/download-pdf?contractId=${contractId}`)
      const data = await response.json()
      
      if (data.success) {
        setPdfStatus({
          can_download: data.can_download,
          has_pdf: data.has_pdf,
          pdf_url: data.contract.pdf_url,
          is_processing: false,
          notifications: data.notifications
        })
      }
    } catch (error) {
      console.error('Error fetching PDF status:', error)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    setStatusMessage('Generating contract PDF...')

    try {
      const response = await fetch(`/api/contracts/${contractId}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('PDF generated successfully!')
        // Refresh the contract data to get the new PDF URL
        refetch()
        // Update PDF status
        setPdfStatus(prev => ({
          ...prev,
          has_pdf: true,
          pdf_url: data.pdf_url
        }))
      } else {
        setStatusMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      setStatusMessage('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleRefreshStatus = () => {
    fetchPDFStatus()
  }

  // Show invalid contract ID state
  if (!isValidContractId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Contract ID</h3>
              <p className="text-gray-600 mb-6">The contract ID format is invalid. Please check the URL and try again.</p>
              <Button asChild>
                <Link href={`/${locale}/contracts`}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to Contracts
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <LoadingSpinner />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Loading Contract...</h3>
              <p className="text-gray-600">Please wait while we fetch the contract details.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Contract</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex items-center justify-center gap-4">
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button asChild>
                  <Link href={`/${locale}/contracts`}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Contracts
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show contract not found state
  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <FileTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contract Not Found</h3>
              <p className="text-gray-600 mb-6">The contract you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <div className="flex items-center justify-center gap-4">
                <Button asChild>
                  <Link href={`/${locale}/contracts`}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Contracts
                  </Link>
                </Button>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isApproved = contract.approval_status === 'active'
  const hasPDF = !!contract.pdf_url

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-8xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Link href={`/${params?.locale}/contracts`}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Contracts
              </Link>
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Contracts</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Contract Details</span>
            </nav>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
                  <StatusBadge status={contract?.status} />
                  {isApproved && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-500">Contract ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{contractId}</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={async () => {
                          try {
                            if (typeof window !== 'undefined' && contractId) {
                              await copyToClipboard(contractId)
                            }
                          } catch (error) {
                            console.error('Failed to copy contract ID:', error)
                          }
                        }}
                      >
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Created</label>
                    <p className="text-gray-900 mt-1">{formatDate(contract?.created_at)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900 mt-1">{formatDate(contract?.updated_at)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Duration</label>
                    <p className="text-gray-900 mt-1">{calculateDuration(contract?.contract_start_date, contract?.contract_end_date)}</p>
                  </div>
                </div>

                {/* PDF Status Section */}
                {isApproved && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-blue-900">PDF & Email Status</h4>
                          <p className="text-sm text-blue-700">
                            {hasPDF ? 'PDF generated and emails sent' : 'PDF generation and email sending available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasPDF && contract.pdf_url ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLinkIcon className="mr-2 h-4 w-4" />
                              View PDF
                            </a>
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={handleDownloadPDF}
                            disabled={downloading || pdfStatus.is_processing}
                          >
                            {downloading ? (
                              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <DownloadIcon className="mr-2 h-4 w-4" />
                            )}
                            {downloading ? 'Generating...' : 'Generate PDF'}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleRefreshStatus}
                        >
                          <RefreshCwIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {statusMessage && (
                      <Alert className="mt-3">
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertDescription>{statusMessage}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-6">
                <Button variant="outline" size="sm">
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button asChild size="sm">
                  <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="parties" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Parties
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="followup" className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              Follow-up
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <MoreHorizontalIcon className="h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Using our refactored component */}
          <TabsContent value="overview">
            <OverviewTab contract={contract} />
          </TabsContent>

          {/* Parties Tab - Enhanced with complete party information */}
          <TabsContent value="parties" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Party (Employer) */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    First Party (Employer)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (English)</label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {contract?.first_party?.name_en || "Not specified"}
                      </p>
                    </div>
                    
                    {contract?.first_party?.name_ar && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                        <p className="font-semibold text-gray-900 mt-1" dir="rtl">
                          {contract.first_party.name_ar}
                        </p>
                      </div>
                    )}
                    
                    {contract?.first_party?.crn && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Commercial Registration Number</label>
                        <p className="font-mono text-sm text-gray-700 mt-1">{contract.first_party.crn}</p>
                      </div>
                    )}
                    
                    {contract?.first_party?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-700 mt-1 flex items-center gap-2">
                          <MailIcon className="h-4 w-4 text-gray-500" />
                          {contract.first_party.email}
                        </p>
                      </div>
                    )}
                    
                    {contract?.first_party?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-700 mt-1">{contract.first_party.phone}</p>
                      </div>
                    )}
                    
                    {contract?.first_party?.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-700 mt-1 flex items-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                          {contract.first_party.address}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {contract?.first_party_id && (
                    <div className="pt-3 border-t border-gray-200">
                      <label className="text-sm font-medium text-gray-500">First Party ID</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono flex-1">
                          {contract.first_party_id}
                        </code>
                                              <Button size="sm" variant="ghost" onClick={() => {
                        if (typeof window !== 'undefined') {
                          copyToClipboard(contract.first_party_id || '')
                        }
                      }}>
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Second Party (Employee) */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Second Party (Employee)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name (English)</label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {contract?.second_party?.name_en || "Not specified"}
                      </p>
                    </div>
                    
                    {contract?.second_party?.name_ar && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                        <p className="font-semibold text-gray-900 mt-1" dir="rtl">
                          {contract.second_party.name_ar}
                        </p>
                      </div>
                    )}
                    
                    {contract?.id_card_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ID Card Number</label>
                        <p className="font-mono text-sm text-gray-700 mt-1">{contract.id_card_number}</p>
                      </div>
                    )}
                    
                    {(contract?.email || contract?.second_party?.email) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-700 mt-1 flex items-center gap-2">
                          <MailIcon className="h-4 w-4 text-gray-500" />
                          {contract?.email || contract?.second_party?.email}
                        </p>
                      </div>
                    )}
                    
                    {contract?.second_party?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-700 mt-1">{contract.second_party.phone}</p>
                      </div>
                    )}
                    
                    {contract?.second_party?.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-700 mt-1 flex items-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                          {contract.second_party.address}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {contract?.second_party_id && (
                    <div className="pt-3 border-t border-gray-200">
                      <label className="text-sm font-medium text-gray-500">Second Party ID</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono flex-1">
                          {contract.second_party_id}
                        </code>
                                              <Button size="sm" variant="ghost" onClick={() => {
                        if (typeof window !== 'undefined') {
                          copyToClipboard(contract.second_party_id || '')
                        }
                      }}>
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Promoters Section */}
            {contract?.promoter && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Promoter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900">{contract.promoter.name_en}</div>
                    <div className="text-sm text-gray-500">{contract.promoter.email}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab - Enhanced with better document management */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Contract Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">

                  
                  {contract?.pdf_url && (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <DownloadIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">PDF Document</h4>
                          <p className="text-sm text-gray-500">Downloadable PDF version</p>
                          <p className="text-xs text-gray-400 mt-1 break-all">{contract.pdf_url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={contract.pdf_url} target="_blank">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                          </Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          if (typeof window !== 'undefined') {
                            copyToClipboard(contract.pdf_url || '')
                          }
                        }}>
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!contract?.pdf_url && (
                    <div className="text-center py-12 text-gray-500">
                      <FileTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF Available</h3>
                      <p className="text-sm">No PDF has been generated for this contract yet.</p>
                      <div className="mt-6">
                        <Button 
                          onClick={handleDownloadPDF}
                          disabled={downloading}
                          className="mr-3"
                        >
                          {downloading ? (
                            <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <DownloadIcon className="mr-2 h-4 w-4" />
                          )}
                          {downloading ? 'Generating...' : 'Generate PDF'}
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            Edit Contract
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {contract?.pdf_url && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FileTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Document Management</h4>
                          <p className="text-sm text-blue-700">
                            You can view and download contract documents. To update or add new documents, 
                            use the edit contract feature.
                          </p>
                          <div className="mt-3">
                            <Button asChild size="sm" variant="outline" className="bg-white">
                              <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Edit Documents
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab - Enhanced with comprehensive timeline */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Contract Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    
                    {/* Contract Created */}
                    <div className="flex items-start gap-6">
                      <div className="relative z-10 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <FileTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900">Contract Created</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Contract was initially created in the system
                          </p>
                          <p className="text-xs text-blue-600 mt-2 font-medium">
                            {formatDateTime(contract?.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contract Start Date */}
                    {contract?.contract_start_date && (
                      <div className="flex items-start gap-6">
                        <div className="relative z-10 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-900">Contract Start Date</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Employment period begins
                            </p>
                            <p className="text-xs text-green-600 mt-2 font-medium">
                              {formatDate(contract.contract_start_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    {contract?.updated_at && contract.updated_at !== contract.created_at && (
                      <div className="flex items-start gap-6">
                        <div className="relative z-10 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                          <EditIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-900">Last Updated</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              Contract information was modified
                            </p>
                            <p className="text-xs text-yellow-600 mt-2 font-medium">
                              {formatDateTime(contract.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contract End Date */}
                    {contract?.contract_end_date && (
                      <div className="flex items-start gap-6">
                        <div className="relative z-10 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-900">Contract End Date</h4>
                            <p className="text-sm text-red-700 mt-1">
                              Employment period ends
                            </p>
                            <p className="text-xs text-red-600 mt-2 font-medium">
                              {formatDate(contract.contract_end_date)}
                            </p>
                            {new Date(contract.contract_end_date) > new Date() && (
                              <p className="text-xs text-red-500 mt-1">
                                {Math.ceil((new Date(contract.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Timeline Summary */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900">Contract Duration</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {calculateDuration(contract?.contract_start_date, contract?.contract_end_date)}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900">Current Status</h5>
                      <div className="mt-1">
                        <StatusBadge status={contract?.status} />
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900">Last Activity</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(contract?.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab - Placeholder for future modularization */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5" />
                  Contract History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <HistoryIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No history data available</p>
                  <p className="text-sm">History tracking will be implemented in future updates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Follow-up Tab - New tab for tracking PDF/email status */}
          <TabsContent value="followup" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5" />
                  Follow-up & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PDF Status Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileTextIcon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">PDF Status</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      {hasPDF ? 'Generated' : 'Not generated'}
                    </p>
                                         {hasPDF && contract.pdf_url && (
                       <Button size="sm" variant="outline" className="mt-2" asChild>
                         <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                           <ExternalLinkIcon className="mr-2 h-4 w-4" />
                           View PDF
                         </a>
                       </Button>
                     )}
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MailIcon className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Email Status</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      {hasPDF ? 'Sent to client & employer' : 'Pending PDF generation'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Approval Status</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      {isApproved ? 'Fully approved' : contract.approval_status || 'Not submitted'}
                    </p>
                  </div>
                </div>

                {/* Recent Notifications */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {pdfStatus.notifications.length > 0 ? (
                      pdfStatus.notifications.map((notification, index) => (
                        <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(notification.created_at)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Actions */}
                {!hasPDF && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Manual Actions</h4>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <DownloadIcon className="mr-2 h-4 w-4" />
                        )}
                        {downloading ? 'Generating...' : 'Generate PDF'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleRefreshStatus}
                      >
                        <RefreshCwIcon className="mr-2 h-4 w-4" />
                        Refresh Status
                      </Button>
                      {contract?.status === 'processing' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/contracts/${contractId}/fix-processing`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                              })
                              const data = await response.json()
                              
                              if (data.success) {
                                setStatusMessage('Processing status fixed successfully!')
                                refetch()
                              } else {
                                setStatusMessage(`Error: ${data.error}`)
                              }
                            } catch (error) {
                              console.error('Error fixing processing status:', error)
                              setStatusMessage('Failed to fix processing status')
                            }
                          }}
                        >
                          <RefreshCwIcon className="mr-2 h-4 w-4" />
                          Fix Processing
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab - Placeholder for future modularization */}
          <TabsContent value="actions" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MoreHorizontalIcon className="h-5 w-5" />
                  Contract Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild>
                    <Link href={`/${params?.locale}/edit-contract/${contractId}`}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit Contract
                    </Link>
                  </Button>
                  <Button variant="outline">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send for Review
                  </Button>
                  <Button variant="outline">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline">
                    <EyeIcon className="mr-2 h-4 w-4" />
                    Preview Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
  )
}
