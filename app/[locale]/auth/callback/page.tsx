"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()

        // Get the error and next parameters from the URL
        const error = searchParams?.get("error")
        // Get the current locale from the URL
        const pathname = typeof window !== "undefined" ? window.location.pathname : ""
        const locale = pathname.split("/")[1] || "en"
        const next = searchParams?.get("next") || `/${locale}/dashboard`

        if (error) {
          setStatus("error")
          setMessage(error)
          return
        }

        // Handle the auth callback
        const { data, error: authError } = await supabase.auth.getSession()

        if (authError) {
          setStatus("error")
          setMessage(authError.message)
          return
        }

        if (data.session) {
          setStatus("success")
          setMessage("Authentication successful! Redirecting...")

          // Redirect after a short delay
          setTimeout(() => {
            router.push(next)
          }, 2000)
        } else {
          setStatus("error")
          setMessage("No session found. Please try again.")
        }
      } catch (error) {
        setStatus("error")
        setMessage("An unexpected error occurred.")
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="mb-4 flex items-center justify-center">
              {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-blue-600" />}
              {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
              {status === "error" && <XCircle className="h-12 w-12 text-red-600" />}
            </div>
            <CardTitle className="text-center text-2xl">
              {status === "loading" && "Processing..."}
              {status === "success" && "Success!"}
              {status === "error" && "Error"}
            </CardTitle>
            <CardDescription className="text-center">
              {status === "loading" && "Please wait while we process your request"}
              {status === "success" && "Your account has been successfully verified"}
              {status === "error" && "Something went wrong"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant={status === "error" ? "destructive" : "default"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <Button
                className="w-full"
                onClick={() => {
                  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
                  const locale = pathname.split("/")[1] || "en"
                  router.push(`/${locale}/auth/login`)
                }}
              >
                Back to login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
