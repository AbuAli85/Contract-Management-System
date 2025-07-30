"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"
import EnhancedContractForm from "@/components/enhanced-contract-form"

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic"

export default function TestEnhancedContractFormPage() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [contractId, setContractId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Enhanced Contract Form Test</h1>
          <p className="text-muted-foreground">
            Test the Enhanced Contract Form with dropdown fields for Job Title, Department, and Work
            Location
          </p>
        </div>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle>Form Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Enhanced Contract Form</strong> now includes dropdown fields for:
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Job Title</h3>
                  <Badge variant="default">✅ Dropdown</Badge>
                  <p className="mt-1 text-sm text-muted-foreground">22 predefined job titles</p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Department</h3>
                  <Badge variant="default">✅ Dropdown</Badge>
                  <p className="mt-1 text-sm text-muted-foreground">16 predefined departments</p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Work Location</h3>
                  <Badge variant="default">✅ Dropdown</Badge>
                  <p className="mt-1 text-sm text-muted-foreground">
                    80+ locations with descriptions
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
                console.log("Contract generated successfully:", contractId)
              }}
              onError={(error) => {
                setError(error)
                setFormSubmitted(false)
                console.error("Contract generation failed:", error)
              }}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">What to Test:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>Fill in the basic contract information (parties, dates, etc.)</li>
                  <li>
                    Test the <strong>Job Title</strong> dropdown - should show 22 options including
                    new sales roles
                  </li>
                  <li>
                    Test the <strong>Department</strong> dropdown - should show 16 options
                  </li>
                  <li>
                    Test the <strong>Work Location</strong> dropdown - should show 80+ options with
                    descriptions
                  </li>
                  <li>Submit the form to test the complete workflow</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">New Job Titles Added:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>
                    <strong>Sales Promoter</strong> - For promotional sales roles
                  </li>
                  <li>
                    <strong>Home Appliances Sales</strong> - For home appliance sales positions
                  </li>
                  <li>
                    <strong>Salesman/Saleswoman Electronics</strong> - For electronics sales roles
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Expected Behavior:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>All three fields should be dropdown selects, not text inputs</li>
                  <li>Work Location dropdown should show both location name and description</li>
                  <li>Form should validate that these fields are selected</li>
                  <li>Form should submit successfully with the selected values</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison with Other Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Form Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Enhanced Contract Form</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Job Title:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Location:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Unified Contract Form</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Job Title:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Location:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Generate Contract Form</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Job Title:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Location:</span>
                    <Badge variant="default">Dropdown</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
