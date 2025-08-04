"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthLogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Get current locale from URL
    const pathname = typeof window !== "undefined" ? window.location.pathname : ""
    const locale = pathname.split("/")[1] || "en"
    
    // Redirect to the correct logout page
    router.replace("/" + locale + "/logout")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
        <h1 className="mb-4 text-2xl font-bold">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the logout page.</p>
      </div>
    </div>
  )
}

// Force dynamic rendering
export const dynamic = "force-dynamic" 