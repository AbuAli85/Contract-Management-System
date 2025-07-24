"use client" // Using client component for potential future interactions and hooks

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Promoter, Contract, Party } from "@/lib/types"
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
import { useUserRole } from '@/hooks/useUserRole'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

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
  const role = useUserRole()

  useEffect(() => {
    if (!promoterId) return

    async function fetchPromoterDetails() {
      setIsLoading(true)
      setError(null)

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
          second_party:parties!inner(id, name_en, name_ar)
        `
        )
        .eq("promoter_id", promoterId)

      if (contractsError) {
        setError(contractsError.message)
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
      if (role !== 'admin') return
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'promoters')
        .eq('record_id', promoterId)
        .order('created_at', { ascending: false })
      if (!error && data) setAuditLogs(data)
    }

    fetchPromoterDetails()
    fetchAuditLogs()
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
          <p className="text-red-600 mb-4">{error || "Promoter not found"}</p>
          <Button onClick={() => router.push("/manage-promoters")}>Back to Promoters</Button>
        </div>
      </div>
    )
  }

  // --- Profile Overview Section ---
  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={promoterDetails.profile_picture_url || undefined} alt={promoterDetails.name_en} />
            <AvatarFallback>{promoterDetails.name_en?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold truncate">{promoterDetails.name_en}</h2>
              <Badge variant="outline" className="text-base px-3 py-1">
                {promoterDetails.status}
              </Badge>
              {promoterDetails.tags && promoterDetails.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {promoterDetails.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-col md:flex-row gap-4 text-muted-foreground">
              <span>Email: {promoterDetails.email || <span className="text-gray-400">N/A</span>}</span>
              <span>Phone: {promoterDetails.phone || <span className="text-gray-400">N/A</span>}</span>
              <span>Address: {promoterDetails.address || <span className="text-gray-400">N/A</span>}</span>
            </div>
          </div>
          {role === 'admin' && (
            <Button variant="outline" onClick={() => router.push(`/manage-promoters/${promoterDetails.id}/edit`)}>
              <EditIcon className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/40 flex flex-col items-start gap-4 p-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {promoterDetails.profile_picture_url ? (
              <img
                src={promoterDetails.profile_picture_url}
                alt={promoterDetails.name_en}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <UserCircle2Icon className="h-20 w-20 text-muted-foreground" />
            )}
            <div className="grid gap-1">
              <CardTitle className="text-2xl">{promoterDetails.name_en}</CardTitle>
              {promoterDetails.company && (
                <CardDescription className="flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4" />
                  <span>{promoterDetails.company}</span>
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            <div className="grid gap-4 md:col-span-1">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <DetailItem label="Contact Person" value={promoterDetails.contact_person} />
              <DetailItem label="Email" value={promoterDetails.email} />
              <DetailItem label="Phone" value={promoterDetails.phone} />
              {promoterDetails.website && (
                <DetailItem
                  label="Website"
                  value={
                    <a
                      href={promoterDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-500 hover:underline"
                    >
                      {promoterDetails.website}
                      <ExternalLinkIcon className="ml-1 h-4 w-4" />
                    </a>
                  }
                />
              )}
            </div>
            <div className="grid gap-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Location</h3>
              <DetailItem label="Address" value={promoterDetails.address} />
              <DetailItem label="City" value={promoterDetails.city} />
              <DetailItem label="Country" value={promoterDetails.country} />
            </div>
          </div>

          <Separator className="my-8" />

          <div>
            <h3 className="mb-4 text-lg font-semibold">Associated Contracts</h3>
            {promoterDetails.contracts && promoterDetails.contracts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract Name</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoterDetails.contracts.map(contract => {
                      const statusInfo = getDocumentStatus(contract.end_date)
                      const party = (contract as any).second_party as Party | undefined;
                      return (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">{contract.contract_name}</TableCell>
                          <TableCell>{party?.name_en ?? "N/A"}</TableCell>
                          <TableCell>
                            <DocumentStatusBadge type="document" status={statusInfo.status} label={statusInfo.text} expiryDate={contract.end_date} />
                          </TableCell>
                          <TableCell>
                            {contract.end_date
                              ? format(parseISO(contract.end_date), "PPP")
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/contracts/${contract.id}`} passHref>
                              <Button variant="outline" size="sm">
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  This promoter has no associated contracts yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>History of changes and actions for this promoter</CardDescription>
        </CardHeader>
        <CardContent>
          {role !== 'admin' ? (
            <div className="text-muted-foreground text-sm">Only admins can view the activity timeline.</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-muted-foreground text-sm">No activity found for this promoter.</div>
          ) : (
            <ul className="space-y-4">
              {auditLogs.map(log => (
                <li key={log.id} className="border-l-2 border-primary pl-4 relative">
                  <div className="absolute -left-2 top-1.5 w-3 h-3 bg-primary rounded-full" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{format(parseISO(log.created_at), 'yyyy-MM-dd HH:mm')}</span>
                    <span className="font-semibold">{log.action}</span>
                    <span className="text-xs">By: {log.user_id}</span>
                    <span className="text-xs text-muted-foreground break-all">{typeof log.new_values === 'string' ? log.new_values : JSON.stringify(log.new_values)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}