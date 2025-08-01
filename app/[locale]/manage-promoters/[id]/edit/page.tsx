"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import type { Promoter } from "@/lib/types"
import { ArrowLeftIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import PromoterFormProfessional from "@/components/promoter-form-professional"

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

  useEffect(() => {
    if (!promoterId) return

    async function fetchPromoter() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading promoter...</span>
      </div>
    )
  }

  if (error || !promoter) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || "Promoter not found"}</p>
          <Button onClick={() => router.push(`/${locale}/manage-promoters`)}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Promoters
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950 sm:py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/manage-promoters/${promoterId}`)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Promoter Details
          </Button>
        </div>

        <PromoterFormProfessional
          promoterToEdit={promoter}
          onFormSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic"
