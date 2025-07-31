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

  const [promoterDetails, setPromoterDetails] = useState<PromoterDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [skills, setSkills] = useState<PromoterSkill[]>([])
  const [experience, setExperience] = useState<PromoterExperience[]>([])
  const [education, setEducation] = useState<PromoterEducation[]>([])
  const [documents, setDocuments] = useState<PromoterDocument[]>([])
  const role = useUserRole()

  useEffect(() => {
    if (!promoterId) return

    async function fetchPromoterDetails() {
      setIsLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      const { data: promoterData, error: promoterError } = await supabase
        .from("promoters")
        .select("*, promoter_tags:promoter_tags(tag:tags(name))")
        .eq("id", promoterId)
        .single()

      if (promoterError || !promoterData) {
        setError(promoterError?.message || "Promoter not found.")
        setIsLoading(false)
        return
      }

      // Extract tags as array of strings
      const tags = promoterData.promoter_tags?.map((pt: any) => pt.tag?.name).filter(Boolean) || []

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
          <Button onClick={() => router.push("/manage-promoters")}>Back to Promoters</Button>
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
            <Button onClick={() => router.push(`/manage-promoters/${promoterId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cv-resume">CV/Resume</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
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
                      {promoterDetails?.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{promoterDetails?.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{promoterDetails?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                      <p>{promoterDetails?.mobile_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p>{promoterDetails?.address || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseIcon className="h-5 w-5" />
                Contract Information
              </CardTitle>
              <CardDescription>Current and historical contract details</CardDescription>
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

          {/* Document Status Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Document Status
              </CardTitle>
              <CardDescription>Current status of important documents</CardDescription>
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
                  {promoterDetails?.id_card_expiry_date && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(parseISO(promoterDetails.id_card_expiry_date), "MMM dd, yyyy")}
                    </p>
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
                  {promoterDetails?.passport_expiry_date && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(parseISO(promoterDetails.passport_expiry_date), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </div>
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

          {/* Additional Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Other important details about the promoter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailItem label="ID Card Number" value={promoterDetails?.id_card_number} />
                <DetailItem label="Passport Number" value={promoterDetails?.passport_number} />
                <DetailItem label="National ID" value={promoterDetails?.national_id} />
                <DetailItem label="CRN" value={promoterDetails?.crn} />
                <DetailItem label="Notes" value={promoterDetails?.notes} />
                <DetailItem 
                  label="Created Date" 
                  value={promoterDetails?.created_at ? format(parseISO(promoterDetails.created_at), "MMM dd, yyyy") : "N/A"} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cv-resume" className="space-y-6">
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

        <TabsContent value="attendance" className="space-y-6">
          <PromoterAttendance promoterId={promoterId} isAdmin={role === "admin"} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <PromoterReports promoterId={promoterId} isAdmin={role === "admin"} />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-6">
          <PromoterRanking promoterId={promoterId} isAdmin={role === "admin"} />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <PromoterCRM promoterId={promoterId} isAdmin={role === "admin"} />
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
