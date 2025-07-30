"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Info } from "lucide-react"
import EnhancedContractForm from "@/components/enhanced-contract-form"

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic"

export default function TestMakecomEnhancedFormPage() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [contractId, setContractId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">
            Enhanced Contract Form - Make.com Integration Test
          </h1>
          <p className="text-muted-foreground">
            Test the Enhanced Contract Form to ensure it's using Make.com integration and Google
            Docs templates
          </p>
        </div>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Make.com Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Enhanced Contract Form</strong> now uses Make.com integration for contract
                  generation
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Make.com Integration</h3>
                  <Badge variant="default">✅ Active</Badge>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Uses generateContractWithMakecom action
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Google Docs Templates</h3>
                  <Badge variant="default">✅ Active</Badge>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generates contracts from Google Docs templates
                  </p>
                </div>
              </div>

              {formSubmitted && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Form submitted successfully! Contract ID: <strong>{contractId}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Error: {error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Contract Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Contract Form</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedContractForm
              onSuccess={(contractId) => {
                setFormSubmitted(true)
                setContractId(contractId)
                setError(null)
                console.log("Contract generated successfully with Make.com:", contractId)
              }}
              onError={(error) => {
                setError(error)
                setFormSubmitted(false)
                console.error("Contract generation failed:", error)
              }}
            />
          </CardContent>
        </Card>

        {/* Integration Details */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">What Happens When You Submit:</h3>
                <ol className="list-inside list-decimal space-y-2 text-sm">
                  <li>
                    <strong>Form Data Collection:</strong> All form fields are collected (parties,
                    dates, job details, etc.)
                  </li>
                  <li>
                    <strong>Make.com Action Call:</strong> Calls{" "}
                    <code>generateContractWithMakecom</code> server action
                  </li>
                  <li>
                    <strong>Database Storage:</strong> Contract data is saved to Supabase database
                  </li>
                  <li>
                    <strong>Make.com Webhook:</strong> Triggers Make.com scenario with contract data
                  </li>
                  <li>
                    <strong>Google Docs Processing:</strong> Make.com creates document from Google
                    Docs template
                  </li>
                  <li>
                    <strong>PDF Generation:</strong> Google Docs document is converted to PDF
                  </li>
                  <li>
                    <strong>Storage & Notification:</strong> PDF is stored and status is updated
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Expected Behavior:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>Form should submit without errors</li>
                  <li>Success message should indicate Make.com processing</li>
                  <li>Contract should be created in database with proper status</li>
                  <li>Make.com should receive webhook with contract data</li>
                  <li>Google Docs template should be populated with form data</li>
                  <li>PDF should be generated and stored</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Environment Variables Required:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>
                    <code>MAKE_WEBHOOK_URL</code> - Make.com webhook URL
                  </li>
                  <li>
                    <code>GOOGLE_DOCS_TEMPLATE_ID</code> - Google Docs template ID
                  </li>
                  <li>
                    <code>GOOGLE_SERVICE_ACCOUNT_KEY</code> - Google service account credentials
                  </li>
                  <li>
                    <code>SUPABASE_URL</code> - Supabase project URL
                  </li>
                  <li>
                    <code>SUPABASE_SERVICE_ROLE_KEY</code> - Supabase service role key
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Common Issues:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>
                    <strong>Form submission fails:</strong> Check server logs for validation errors
                  </li>
                  <li>
                    <strong>Make.com not triggered:</strong> Verify MAKE_WEBHOOK_URL environment
                    variable
                  </li>
                  <li>
                    <strong>Google Docs not created:</strong> Check Google service account
                    permissions
                  </li>
                  <li>
                    <strong>PDF not generated:</strong> Verify Google Docs template exists and is
                    accessible
                  </li>
                  <li>
                    <strong>Database errors:</strong> Check Supabase connection and permissions
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Debug Steps:</h3>
                <ol className="list-inside list-decimal space-y-1 text-sm">
                  <li>Check browser console for client-side errors</li>
                  <li>Check server logs for server-side errors</li>
                  <li>Verify environment variables are set correctly</li>
                  <li>Test Make.com webhook manually with sample data</li>
                  <li>Check Google Docs API permissions and template access</li>
                  <li>Verify Supabase database connection and RLS policies</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
