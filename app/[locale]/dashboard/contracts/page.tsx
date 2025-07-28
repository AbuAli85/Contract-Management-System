"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardContractsPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string

  useEffect(() => {
    // Redirect to the main contracts page
    router.replace(`/${locale}/contracts`)
  }, [router, locale])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to contracts...</p>
      </div>
    </div>
  )
} 