"use client" // Using client component for potential future interactions and hooks

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import type {
  Promoter,
  Contract,
  Party,
  PromoterSkill,
  PromoterExperience,
  PromoterEducation,
  PromoterDocument,
} from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeftIcon,
  UserCircle2Icon,
  FileTextIcon,
  BriefcaseIcon,
  ExternalLinkIcon,
  Loader2,
  EditIcon,
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  Upload,
  Eye,
  Download,
} from "lucide-react"
import { format, parseISO, isPast } from "date-fns"
import { getDocumentStatus } from "@/lib/document-status"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocumentStatusBadge } from "@/components/unified-status-badge"
import { useUserRole } from "@/hooks/useUserRole"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PromoterCVResume } from "@/components/promoter-cv-resume"
import { PromoterAttendance } from "@/components/promoter-attendance"
import { PromoterReports } from "@/components/promoter-reports"
import { PromoterRanking } from "@/components/promoter-ranking"
import { PromoterCRM } from "@/components/promoter-crm"
import DocumentUpload from "@/components/document-upload"

interface PromoterDetails extends Promoter {
  contracts: Contract[]
}

function DetailItem({
  label,
  value,
  isRtl = false,
  className = "",
  labelClassName = "text-sm text-muted-foreground",
  valueClassName = "text-sm font-medium",
}: {
  label: string
  value?: string | null | React.ReactNode
  isRtl?: boolean
  className?: string
  labelClassName?: string
  valueClassName?: string
}) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null
  }
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <p className={labelClassName}>{label}</p>
      {typeof value === "string" ? (
        <p className={`${valueClassName} ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
          {value}
        </p>
      ) : (
        <div className={valueClassName}>{value}</div>
      )}
    </div>
  )
}

export default function PromoterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const promoterId = params?.id as string
  const locale = params?.locale as string

  const [promoterDetails, setPromoterDetails] = useState<PromoterDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [skills, setSkills] = useState<PromoterSkill[]>([])
  const [experience, setExperience] = useState<PromoterExperience[]>([])
  const [education, setEducation] = useState<PromoterEducation[]>([])
  const [documents, setDocuments] = useState<PromoterDocument[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const role = useUserRole()

  async function handleDeletePromoter() {
    if (!confirm('Are you sure you want to delete this promoter? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const supabase = getSupabaseClient()
      
      // Delete related records first (if they exist)
      await supabase.from('promoter_skills').delete().eq('promoter_id', promoterId)
      await supabase.from('promoter_experience').delete().eq('promoter_id', promoterId)
      await supabase.from('promoter_education').delete().eq('promoter_id', promoterId)
      await supabase.from('promoter_documents').delete().eq('promoter_id', promoterId)
      
      // Delete the promoter
      const { error } = await supabase
        .from('promoters')
        .delete()
        .eq('id', promoterId)

      if (error) {
        throw new Error(error.message)
      }

      // Redirect to promoters list
      router.push(`/${locale}/manage-promoters`)
    } catch (error) {
      console.error('Error deleting promoter:', error)
      alert('Failed to delete promoter. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleToggleStatus() {
    if (!promoterDetails) return

    setIsUpdatingStatus(true)
    try {
      const supabase = getSupabaseClient()
      const newStatus = promoterDetails.status === 'active' ? 'inactive' : 'active'
      
      const { error } = await supabase
        .from('promoters')
        .update({ status: newStatus })
        .eq('id', promoterId)

      if (error) {
        throw new Error(error.message)
      }

      // Update local state
      setPromoterDetails(prev => prev ? { ...prev, status: newStatus } : null)
      
      // Show success message
      alert(`Promoter status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating promoter status:', error)
      alert('Failed to update promoter status. Please try again.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  useEffect(() => {
    if (!promoterId) return

    async function fetchPromoterDetails() {
      setIsLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      const { data: promoterData, error: promoterError } = await supabase
        .from("promoters")
        .select("*")
        .eq("id", promoterId)
        .single()

      if (promoterError || !promoterData) {
        setError(promoterError?.message || "Promoter not found.")
        setIsLoading(false)
        return
      }

      // Get tags from promoter_tags table if it exists
      let tags: string[] = []
      try {
        const { data: tagsData, error: tagsError } = await supabase
          .from('promoter_tags')
          .select('tag')
          .eq('promoter_id', promoterId)
        
        if (!tagsError && tagsData) {
          tags = tagsData.map(t => t.tag).filter(Boolean)
        }
      } catch (error) {
        // If promoter_tags table doesn't exist, use empty array
        console.log('promoter_tags table not available, using empty tags array')
      }

      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select(
          `
          *,
          second_party:parties!contracts_second_party_id_fkey(id, name_en, name_ar)
        `,
        )
        .eq("promoter_id", promoterId)

      if (contractsError) {
        console.error("Error fetching contracts:", contractsError)
        // Don't set error for contracts, just log it
      }

      setPromoterDetails({
        ...promoterData,
        contracts: (contractsData as any) || [],
        name_en: promoterData.name_en || "",
        name_ar: promoterData.name_ar || "",
        id_card_number: promoterData.id_card_number || "",
        tags,
      })
      setIsLoading(false)
    }

    async function fetchAuditLogs() {
      if (role !== "admin") return
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("table_name", "promoters")
        .eq("record_id", promoterId)
        .order("created_at", { ascending: false })
      if (!error && data) setAuditLogs(data)
    }

    async function fetchCVData() {
      if (!promoterId) return
      try {
        // Fetch skills
        const skillsResponse = await fetch(`/api/promoters/${promoterId}/skills`)
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json()
          setSkills(skillsData)
        }

        // Fetch experience
        const experienceResponse = await fetch(`/api/promoters/${promoterId}/experience`)
        if (experienceResponse.ok) {
          const experienceData = await experienceResponse.json()
          setExperience(experienceData)
        }

        // Fetch education
        const educationResponse = await fetch(`/api/promoters/${promoterId}/education`)
        if (educationResponse.ok) {
          const educationData = await educationResponse.json()
          setEducation(educationData)
        }

        // Fetch documents
        const documentsResponse = await fetch(`/api/promoters/${promoterId}/documents`)
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json()
          setDocuments(documentsData)
        }
      } catch (error) {
        console.error("Error fetching CV data:", error)
      }
    }



    fetchPromoterDetails()
    fetchAuditLogs()
    fetchCVData()
  }, [promoterId, role])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading promoter...</span>
      </div>
    )
  }

  if (error || !promoterDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || "Promoter not found"}</p>
          <Button onClick={() => router.push(`/${locale}/manage-promoters`)}>Back to Promoters</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promoter Details</h1>
          <p className="text-muted-foreground">Manage promoter information and profile</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {role === "admin" && (
            <>
              <Button onClick={() => router.push(`/${locale}/manage-promoters/${promoterId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/${locale}/manage-promoters/new`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeletePromoter}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      {role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common actions for this promoter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/${locale}/manage-promoters/${promoterId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Promoter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/${locale}/generate-contract?promoter=${promoterId}`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Contract
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/${locale}/contracts?promoter=${promoterId}`)}
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                View Contracts
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/${locale}/promoter-analysis/${promoterId}`)}
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                Toggle Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle2Icon className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Basic personal details and contact information</CardDescription>
                </div>
                {role === "admin" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/${locale}/manage-promoters/${promoterId}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Personal Info
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/${locale}/manage-promoters/${promoterId}`)}
                    >
                      <UserCircle2Icon className="mr-2 h-4 w-4" />
                      View Full Profile
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={promoterDetails?.profile_picture_url || undefined}
                    alt={promoterDetails?.name_en}
                  />
                  <AvatarFallback>{promoterDetails?.name_en?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{promoterDetails?.name_en}</h2>
                    <p className="text-lg text-muted-foreground">{promoterDetails?.name_ar}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant={promoterDetails?.status === "active" ? "default" : "secondary"}
                      >
                        {promoterDetails?.status}
                      </Badge>
                      {role === "admin" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleStatus}
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="mr-2 h-4 w-4" />
                          )}
                          Toggle Status
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DetailItem label="Email" value={promoterDetails?.email} />
                    <DetailItem label="Phone" value={promoterDetails?.phone} />
                    <DetailItem label="Mobile" value={promoterDetails?.mobile_number} />
                    <DetailItem label="Nationality" value={promoterDetails?.nationality} />
                    <DetailItem label="Date of Birth" value={promoterDetails?.date_of_birth} />
                    <DetailItem label="Gender" value={promoterDetails?.gender} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Information Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" />
                    Document Information
                  </CardTitle>
                  <CardDescription>Identity documents and their status</CardDescription>
                </div>
                {role === "admin" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {showDocumentUpload ? "Hide Upload" : "Upload Documents"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ID Card</span>
                    <DocumentStatusBadge
                      expiryDate={promoterDetails?.id_card_expiry_date}
                      documentType="id_card"
                    />
                  </div>
                  <DetailItem label="ID Number" value={promoterDetails?.id_card_number} />
                  {promoterDetails?.id_card_expiry_date && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(parseISO(promoterDetails.id_card_expiry_date), "MMM dd, yyyy")}
                    </p>
                  )}
                  {promoterDetails?.id_card_url && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(promoterDetails.id_card_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View ID
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = promoterDetails.id_card_url!
                          link.download = 'ID_Card_Document'
                          link.click()
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Passport</span>
                    <DocumentStatusBadge
                      expiryDate={promoterDetails?.passport_expiry_date}
                      documentType="passport"
                    />
                  </div>
                  <DetailItem 
                    label="Passport Number" 
                    value={promoterDetails?.passport_number || "Not provided"} 
                  />
                  {promoterDetails?.passport_expiry_date && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(parseISO(promoterDetails.passport_expiry_date), "MMM dd, yyyy")}
                    </p>
                  )}
                  {!promoterDetails?.passport_url && !promoterDetails?.passport_number && (
                    <p className="text-xs text-amber-600">
                      ⚠️ No passport information available
                    </p>
                  )}
                  {promoterDetails?.passport_url && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(promoterDetails.passport_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Passport
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = promoterDetails.passport_url!
                          link.download = 'Passport_Document'
                          link.click()
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Upload Section */}
              {showDocumentUpload && role === "admin" && (
                <div className="mt-6 space-y-4">
                  <Separator />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <DocumentUpload
                      promoterId={promoterId}
                      documentType="id_card"
                      currentUrl={promoterDetails?.id_card_url}
                      onUploadComplete={(url) => {
                        setPromoterDetails(prev => prev ? { ...prev, id_card_url: url } : null)
                        setShowDocumentUpload(false)
                      }}
                      onDelete={() => {
                        setPromoterDetails(prev => prev ? { ...prev, id_card_url: null } : null)
                      }}
                    />
                    <DocumentUpload
                      promoterId={promoterId}
                      documentType="passport"
                      currentUrl={promoterDetails?.passport_url}
                      onUploadComplete={(url) => {
                        setPromoterDetails(prev => prev ? { ...prev, passport_url: url } : null)
                        setShowDocumentUpload(false)
                      }}
                      onDelete={() => {
                        setPromoterDetails(prev => prev ? { ...prev, passport_url: null } : null)
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Personal Details</CardTitle>
              <CardDescription>Other personal information and notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailItem label="National ID" value={promoterDetails?.national_id} />
                <DetailItem label="CRN" value={promoterDetails?.crn} />
                <DetailItem label="Marital Status" value={promoterDetails?.marital_status} />
                <DetailItem label="Notes" value={promoterDetails?.notes} />
                <DetailItem 
                  label="Created Date" 
                  value={promoterDetails?.created_at ? format(parseISO(promoterDetails.created_at), "MMM dd, yyyy") : "N/A"} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-6">
          {/* Contract Information Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BriefcaseIcon className="h-5 w-5" />
                    Contract Information
                  </CardTitle>
                  <CardDescription>Current and historical contract details</CardDescription>
                </div>
                {role === "admin" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/${locale}/contracts?promoter=${promoterId}`)}
                    >
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      View All Contracts
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/${locale}/generate-contract?promoter=${promoterId}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Contract
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {promoterDetails?.contracts?.filter(c => c.status === "active").length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Contracts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {promoterDetails?.contracts?.filter(c => c.status === "completed").length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed Contracts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {promoterDetails?.contracts?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Contracts</div>
                </div>
              </div>
              
              {promoterDetails?.contracts && promoterDetails.contracts.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-medium">Recent Contracts</h4>
                  <div className="space-y-2">
                    {promoterDetails.contracts.slice(0, 3).map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{contract.title || "Contract"}</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.start_date && format(parseISO(contract.start_date), "MMM dd, yyyy")} - 
                            {contract.end_date && format(parseISO(contract.end_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                          {contract.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Working Status Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle2Icon className="h-5 w-5" />
                Working Status
              </CardTitle>
              <CardDescription>Current availability and work status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {promoterDetails?.status === "active" ? "Available" : "Not Available"}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Status</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {promoterDetails?.contracts?.filter(c => c.status === "active").length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Assignments</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {promoterDetails?.rating || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">Performance Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>Job details and professional background</CardDescription>
                </div>
                {role === "admin" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/${locale}/manage-promoters/${promoterId}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Professional Info
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailItem label="Job Title" value={promoterDetails?.job_title} />
                <DetailItem label="Company" value={promoterDetails?.company} />
                <DetailItem label="Department" value={promoterDetails?.department} />
                <DetailItem label="Specialization" value={promoterDetails?.specialization} />
                <DetailItem label="Experience Years" value={promoterDetails?.experience_years} />
                <DetailItem label="Education Level" value={promoterDetails?.education_level} />
                <DetailItem label="University" value={promoterDetails?.university} />
                <DetailItem label="Graduation Year" value={promoterDetails?.graduation_year} />
              </div>
            </CardContent>
          </Card>

          {/* CV/Resume Section */}
          <PromoterCVResume
            promoterId={promoterId}
            skills={skills}
            setSkills={setSkills}
            experience={experience}
            setExperience={setExperience}
            education={education}
            setEducation={setEducation}
            documents={documents}
            setDocuments={setDocuments}
            isAdmin={role === "admin"}
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* Attendance Section */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance & Performance</CardTitle>
              <CardDescription>Track attendance and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <PromoterAttendance promoterId={promoterId} isAdmin={role === "admin"} />
            </CardContent>
          </Card>

          {/* Reports Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reports & Analytics</CardTitle>
                  <CardDescription>Detailed reports and performance analytics</CardDescription>
                </div>
                {role === "admin" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/${locale}/promoter-analysis/${promoterId}`)}
                    >
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.print()}
                    >
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <PromoterReports promoterId={promoterId} isAdmin={role === "admin"} />
            </CardContent>
          </Card>

          {/* Ranking Section */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Ranking</CardTitle>
              <CardDescription>Performance rankings and comparisons</CardDescription>
            </CardHeader>
            <CardContent>
              <PromoterRanking promoterId={promoterId} isAdmin={role === "admin"} />
            </CardContent>
          </Card>

          {/* CRM Section */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Relationship Management</CardTitle>
              <CardDescription>CRM data and customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <PromoterCRM promoterId={promoterId} isAdmin={role === "admin"} />
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Banking and financial details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailItem label="Bank Name" value={promoterDetails?.bank_name} />
                <DetailItem label="Account Number" value={promoterDetails?.account_number} />
                <DetailItem label="IBAN" value={promoterDetails?.iban} />
                <DetailItem label="SWIFT Code" value={promoterDetails?.swift_code} />
                <DetailItem label="Tax ID" value={promoterDetails?.tax_id} />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Certifications</CardTitle>
              <CardDescription>Professional skills and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailItem label="Skills" value={promoterDetails?.skills} />
                <DetailItem label="Certifications" value={promoterDetails?.certifications} />
                <DetailItem label="Availability" value={promoterDetails?.availability} />
                <DetailItem label="Preferred Language" value={promoterDetails?.preferred_language} />
                <DetailItem label="Timezone" value={promoterDetails?.timezone} />
                <DetailItem label="Special Requirements" value={promoterDetails?.special_requirements} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Activity Timeline Section */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent activities and changes for this promoter</CardDescription>
            </CardHeader>
            <CardContent>
              {role === "admin" ? (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 rounded-lg border p-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                        {log.new_values && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Changes: {JSON.stringify(log.new_values)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Activity timeline is restricted to administrators.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
