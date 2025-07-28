"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoaderIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react"

interface PromoterData {
  id: string
  name_en: string
  name_ar: string
  id_card_number: string
  status: string
  created_at: string
  [key: string]: any
}

export default function DebugPromoterPage() {
  const params = useParams()
  const promoterId = params?.id as string
  const [promoter, setPromoter] = useState<PromoterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPromoter() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/debug-promoter/${promoterId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch promoter')
        }

        setPromoter(data.promoter)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (promoterId) {
      fetchPromoter()
    }
  }, [promoterId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Promoter Data</h3>
              <p className="text-gray-600">Please wait while we fetch the promoter information...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Error: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!promoter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Promoter not found
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              Promoter Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Promoter ID</h3>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                  {promoter.id}
                </code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Name (English)</h3>
                  <p className="text-gray-700">
                    {promoter.name_en || (
                      <span className="text-red-600 font-medium">Not set</span>
                    )}
                  </p>
                  {promoter.name_en && (
                    <p className="text-sm text-gray-500 mt-1">
                      Length: {promoter.name_en.length} characters
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Name (Arabic)</h3>
                  <p className="text-gray-700" dir="rtl">
                    {promoter.name_ar || (
                      <span className="text-red-600 font-medium">Not set</span>
                    )}
                  </p>
                  {promoter.name_ar && (
                    <p className="text-sm text-gray-500 mt-1">
                      Length: {promoter.name_ar.length} characters
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ID Card Number</h3>
                <p className="font-mono text-gray-700">
                  {promoter.id_card_number || (
                    <span className="text-red-600 font-medium">Not set</span>
                  )}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <Badge variant={promoter.status === 'active' ? 'default' : 'secondary'}>
                  {promoter.status || 'Not set'}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Created At</h3>
                <p className="text-gray-700">
                  {promoter.created_at ? new Date(promoter.created_at).toLocaleString() : 'Not set'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">All Fields</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(promoter, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 