"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Promoter } from "@/lib/types"
import { ArrowLeftIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import PromoterFormProfessional from "@/components/promoter-form-professional"
import PromoterFilterSection from "@/components/promoter-filter-section"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface Employer {
  id: string
  name_en?: string
  name_ar?: string
}

export default function EditPromoterPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const promoterId = params?.id as string
  const locale = (params?.locale as string) || "en"

  const [promoter, setPromoter] = useState<Promoter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCompany, setFilterCompany] = useState("all")
  const [filterDocument, setFilterDocument] = useState("all")
  const [employers, setEmployers] = useState<Employer[]>([])
  const [employersLoading, setEmployersLoading] = useState(true)

  // Handle case where locale is undefined during build
  if (!locale) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Fetch employers for the filter
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const supabase = createClient()
        if (!supabase) return

        const { data, error } = await supabase
          .from("employers")
          .select("id, name_en, name_ar")
          .order("name_en")

        if (error) {
          console.error("Error fetching employers:", error)
          return
        }

        setEmployers(data || [])
      } catch (error) {
        console.error("Error fetching employers:", error)
      } finally {
        setEmployersLoading(false)
      }
    }

    fetchEmployers()
  }, [])

  useEffect(() => {
    if (!promoterId) return

    async function fetchPromoter() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        if (!supabase) {
          throw new Error("Failed to initialize database connection")
        }

        const { data, error } = await supabase
          .from("promoters")
          .select("*")
          .eq("id", promoterId)
          .single()

        if (error) {
          console.error("Database error:", error)
          if (error.code === "PGRST116") {
            setError("Promoter not found. The promoter may have been deleted or the ID is invalid.")
          } else {
            setError(`Database error: ${error.message}`)
          }
          setIsLoading(false)
          return
        }

        if (!data) {
          setError("Promoter not found. The promoter may have been deleted or the ID is invalid.")
          setIsLoading(false)
          return
        }

        setPromoter(data)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching promoter:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred while loading the promoter.")
        setIsLoading(false)
      }
    }

    fetchPromoter()
  }, [promoterId])

  const handleFormSubmit = () => {
    toast({
      title: "Success",
      description: "Promoter updated successfully",
    })
    router.push(`/${locale}/manage-promoters/${promoterId}`)
  }

  const handleCancel = () => {
    router.push(`/${locale}/manage-promoters/${promoterId}`)
  }

  const uniqueCompanies = employers.map(emp => ({
    id: emp.id,
    name: emp.name_en || emp.name_ar || emp.id
  }))

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Promoter Details
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Edit Promoter</h1>
              <p className="text-muted-foreground">Update promoter information</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Edit Mode</Badge>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <PromoterFilterSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterCompany={filterCompany}
            setFilterCompany={setFilterCompany}
            filterDocument={filterDocument}
            setFilterDocument={setFilterDocument}
            employers={employers}
            employersLoading={employersLoading}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading promoter details...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Form */}
        {!isLoading && promoter && (
          <PromoterFormProfessional
            promoterToEdit={promoter}
            onFormSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic"
