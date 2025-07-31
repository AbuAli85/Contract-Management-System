"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import type { Promoter } from "@/lib/types"
import { ArrowLeftIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import PromoterFormSimple from "@/components/promoter-form-simple"

export default function EditPromoterPage() {
  const params = useParams()
  const router = useRouter()
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

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("id", promoterId)
        .single()

      if (error || !data) {
        setError(error?.message || "Promoter not found.")
        setIsLoading(false)
        return
      }

      setPromoter(data)
      setIsLoading(false)
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

        <PromoterFormSimple
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
