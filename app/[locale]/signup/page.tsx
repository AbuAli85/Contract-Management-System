"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignupRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new auth signup page
    router.replace("/auth/signup")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p>Redirecting to signup...</p>
      </div>
    </div>
  )
}
