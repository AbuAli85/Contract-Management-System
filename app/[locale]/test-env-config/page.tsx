"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Info, Settings } from "lucide-react"

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic"

export default function TestEnvConfigPage() {
  const [envConfig, setEnvConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkEnvConfig = async () => {
      try {
        const response = await fetch("/api/test-config")
        const data = await response.json()
        setEnvConfig(data)
      } catch (error) {
        setEnvConfig({ error: "Failed to check environment configuration" })
      } finally {
        setIsLoading(false)
      }
    }

    checkEnvConfig()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <Settings className="mx-auto mb-4 h-8 w-8 animate-spin" />
            <p>Checking environment configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Environment Configuration Test</h1>
          <p className="text-muted-foreground">
            Check the current environment variable configuration for Make.com integration
          </p>
        </div>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {envConfig?.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{envConfig.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">Make.com Webhook URL</h3>
                    {envConfig?.makeWebhookUrl ? (
                      <>
                        <Badge variant="default">✅ Set</Badge>
                        <p className="mt-1 break-all text-sm text-muted-foreground">
                          {envConfig.makeWebhookUrl}
                        </p>
                        {envConfig.makeWebhookUrl.includes("YOUR_") && (
                          <p className="mt-1 text-xs text-red-600">
                            ⚠️ This appears to be a placeholder URL
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <Badge variant="destructive">❌ Not Set</Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          MAKE_WEBHOOK_URL environment variable is not configured
                        </p>
                      </>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">Google Docs Template ID</h3>
                    {envConfig?.googleDocsTemplateId ? (
                      <>
                        <Badge variant="default">✅ Set</Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {envConfig.googleDocsTemplateId}
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="destructive">❌ Not Set</Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          GOOGLE_DOCS_TEMPLATE_ID environment variable is not configured
                        </p>
                      </>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">Supabase Configuration</h3>
                    {envConfig?.supabaseUrl && envConfig?.supabaseServiceRoleKey ? (
                      <>
                        <Badge variant="default">✅ Configured</Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Supabase URL and service role key are set
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="destructive">❌ Not Configured</Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Supabase configuration is missing
                        </p>
                      </>
                    )}
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">Google Service Account</h3>
                    {envConfig?.googleServiceAccountKey ? (
                      <>
                        <Badge variant="default">✅ Set</Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Google service account key is configured
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="destructive">❌ Not Set</Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not configured
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required Environment Variables:</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>MAKE_WEBHOOK_URL:</span>
                  {envConfig?.makeWebhookUrl ? (
                    <Badge variant="default">✅ Configured</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Missing</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>GOOGLE_DOCS_TEMPLATE_ID:</span>
                  {envConfig?.googleDocsTemplateId ? (
                    <Badge variant="default">✅ Configured</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Missing</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>GOOGLE_SERVICE_ACCOUNT_KEY:</span>
                  {envConfig?.googleServiceAccountKey ? (
                    <Badge variant="default">✅ Configured</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Missing</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>SUPABASE_URL:</span>
                  {envConfig?.supabaseUrl ? (
                    <Badge variant="default">✅ Configured</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Missing</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>SUPABASE_SERVICE_ROLE_KEY:</span>
                  {envConfig?.supabaseServiceRoleKey ? (
                    <Badge variant="default">✅ Configured</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Missing</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">If Environment Variables Are Missing:</h3>
                <ol className="list-inside list-decimal space-y-1 text-sm">
                  <li>
                    Create a <code>.env.local</code> file in your project root
                  </li>
                  <li>Add the required environment variables</li>
                  <li>Restart your development server</li>
                  <li>Test the configuration again</li>
                </ol>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Example .env.local File:</h3>
                <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
                  {`# Make.com Integration
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_ACTUAL_WEBHOOK_ID

# Google Docs Integration
GOOGLE_DOCS_TEMPLATE_ID=your_google_docs_template_id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
