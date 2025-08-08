"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  Loader2,
  ExternalLink
} from "lucide-react"
// Updated to use new webhook system

interface WebhookTest {
  type: string
  status: "idle" | "testing" | "success" | "error"
  message: string
  response?: any
}

export default function DebugWebhooksPage() {
  const [webhookStatus, setWebhookStatus] = useState<Record<string, boolean>>({})
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string | undefined>>({})
  const [testResults, setTestResults] = useState<WebhookTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get webhook status and URLs - now using environment variables
    const webhookTypes = ['serviceCreation', 'bookingCreated', 'trackingUpdated', 'paymentSucceeded']
    const status: Record<string, boolean> = {}
    const urls: Record<string, string | undefined> = {}
    
    webhookTypes.forEach(type => {
      const envVar = `MAKE_${type.toUpperCase()}_WEBHOOK`
      const url = process.env[envVar]
      status[type] = !!url
      urls[type] = url
    })
    
    setWebhookStatus(status)
    setWebhookUrls(urls)
    setLoading(false)
  }, [])

  const testWebhook = async (webhookType: string, testPayload: any) => {
    setTestResults(prev => [
      ...prev,
      { type: webhookType, status: "testing", message: "Testing webhook..." }
    ])

    try {
      const response = await fetch(`/api/webhooks/${webhookType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      })

      const result = await response.json()

      setTestResults(prev => 
        prev.map(test => 
          test.type === webhookType 
            ? { 
                type: webhookType, 
                status: response.ok ? "success" : "error",
                message: response.ok ? "Webhook sent successfully" : result.error || "Webhook failed",
                response: result
              }
            : test
        )
      )
    } catch (error) {
      setTestResults(prev => 
        prev.map(test => 
          test.type === webhookType 
            ? { 
                type: webhookType, 
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
                response: null
              }
            : test
        )
      )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      case "testing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const testPayloads = {
    serviceCreation: {
      service_id: crypto.randomUUID(),
      provider_id: "test-provider-id",
      service_name: "Test Service",
      created_at: new Date().toISOString()
    },
    serviceApproval: {
      service_id: crypto.randomUUID(),
      status: "approved",
      updated_at: new Date().toISOString()
    },
    bookingCreated: {
      booking_id: crypto.randomUUID(),
      service_id: "test-service-id",
      user_id: "test-user-id",
      booking_date: new Date().toISOString(),
      status: "confirmed"
    },
    trackingUpdated: {
      tracking_id: crypto.randomUUID(),
      status: "in_transit",
      location: "Test Location",
      updated_at: new Date().toISOString()
    },
    paymentSucceeded: {
      payment_id: crypto.randomUUID(),
      amount: 100.00,
      currency: "USD",
      user_id: "test-user-id",
      service_id: "test-service-id",
      payment_date: new Date().toISOString()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading webhook configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Webhook Debug & Testing</h1>
        <p className="text-muted-foreground">
          Monitor and test all Make.com webhook configurations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Webhook Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration Status</CardTitle>
            <CardDescription>
              Overview of all configured webhook endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {Object.entries(webhookStatus).map(([webhookType, isConfigured]) => (
                <div key={webhookType} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {isConfigured ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <h3 className="font-semibold capitalize">
                        {webhookType.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isConfigured ? "Configured" : "Not configured"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfigured && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = webhookUrls[webhookType]
                          if (url) window.open(url, '_blank')
                        }}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    )}
                    <Badge 
                      variant="outline" 
                      className={isConfigured ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {isConfigured ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Webhook Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Test Webhooks</CardTitle>
            <CardDescription>
              Send test payloads to verify webhook functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {Object.entries(testPayloads).map(([webhookType, payload]) => {
                const isConfigured = webhookStatus[webhookType]
                const testResult = testResults.find(t => t.type === webhookType)
                
                return (
                  <div key={webhookType} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold capitalize">
                          {webhookType.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Test {webhookType} webhook functionality
                        </p>
                      </div>
                      <Button
                        onClick={() => testWebhook(webhookType, payload)}
                        disabled={!isConfigured || testResult?.status === "testing"}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {testResult?.status === "testing" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Test Webhook
                      </Button>
                    </div>

                    {testResult && (
                      <div className={`p-3 rounded-lg border ${getStatusColor(testResult.status)}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(testResult.status)}
                          <span className="font-medium capitalize">
                            {testResult.status}
                          </span>
                        </div>
                        <p className="text-sm">{testResult.message}</p>
                        {testResult.response && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-medium">
                              View Response
                            </summary>
                            <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto">
                              {JSON.stringify(testResult.response, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}

                    {!isConfigured && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ This webhook is not configured. Add the environment variable to test.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables Help */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Add these to your .env.local file to configure webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Service Creation Webhook</Label>
                <Input 
                  value="NEXT_PUBLIC_MAKE_SERVICE_CREATION_WEBHOOK=https://hook.eu2.make.com/ckseohqanys963qtkf773le623k2up7l"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Service Approval Webhook</Label>
                <Input 
                  value="NEXT_PUBLIC_MAKE_APPROVAL_WEBHOOK=https://hook.eu2.make.com/your-approval-webhook-url"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Booking Created Webhook</Label>
                <Input 
                  value="NEXT_PUBLIC_MAKE_BOOKING_CREATED_WEBHOOK=https://hook.eu2.make.com/wb6i8h78k2uxwpq2qvd73lha0hs355ka"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Tracking Updated Webhook</Label>
                <Input 
                  value="NEXT_PUBLIC_MAKE_TRACKING_UPDATED_WEBHOOK=https://hook.eu2.make.com/dxy72blklhm2il5u3g2wl0sg4lkh1bkg"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Payment Succeeded Webhook</Label>
                <Input 
                  value="NEXT_PUBLIC_MAKE_PAYMENT_SUCCEEDED_WEBHOOK=https://hook.eu2.make.com/947cw5hvnj21alg3xvcm0zrv0layaayi"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 