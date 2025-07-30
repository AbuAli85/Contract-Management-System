"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [next, setNext] = useState<string>("/en/dashboard")
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
        const nextUrl = searchParams?.get("next") || `/${locale}/dashboard`
        setNext(nextUrl)

        if (error) {
          setStatus("error")
          setMessage(error)
          return
        }

        // You can add more logic here for success
        setStatus("success")
      } catch (error) {
        setStatus("error")
        setMessage("Unexpected error during authentication callback.")
      }
    }

    handleAuthCallback()
  }, [searchParams])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Callback</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && <Loader2 />}
        {status === "error" && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
        {status === "success" && <Button onClick={() => router.push(next)}>Continue</Button>}
      </CardContent>
    </Card>
  )
}
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
        }
      } catch (error) {
        setStatus("error")
      }
    }

    handleAuthCallback()
  }, [searchParams])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Callback</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && <Loader2 />}
        {status === "error" && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
        {status === "success" && <Button onClick={() => router.push(next)}>Continue</Button>}
      </CardContent>
    </Card>
  )
}
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
        }
      } catch (error) {
        setStatus("error")
      }
    }

    handleAuthCallback()
  }, [searchParams])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Callback</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && <Loader2 />}
        {status === "error" && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
        {status === "success" && <Button onClick={() => router.push(next)}>Continue</Button>}
      </CardContent>
    </Card>
  )
}
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
