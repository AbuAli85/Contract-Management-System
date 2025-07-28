"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { JOB_TITLES, DEPARTMENTS, WORK_LOCATIONS } from "@/constants/contract-options"
import { generateContractWithMakecom } from "@/app/actions/contracts"
import { toast } from "sonner"

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function TestMakecomIntegrationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    first_party_id: "test-client-id",
    second_party_id: "test-employer-id", 
    promoter_id: "test-promoter-id",
    contract_start_date: new Date(),
    contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    email: "test@example.com",
    job_title: "software-engineer",
    work_location: "main-branch",
    department: "technology",
    contract_type: "oman-unlimited-contract",
    currency: "OMR",
    basic_salary: 1000,
    allowances: 200,
    special_terms: "Test contract terms"
  })

  const handleSubmit = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await generateContractWithMakecom(formData)
      setResult(response)
      toast.success("Contract generation initiated!")
    } catch (error) {
      console.error("Contract generation error:", error)
      toast.error(error instanceof Error ? error.message : "Contract generation failed")
      setResult({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Make.com Integration Test</h1>
          <p className="text-muted-foreground">
            Test the Make.com integration with Google Docs templates
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Contract Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Job Title</Label>
                <Select 
                  value={formData.job_title} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, job_title: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map((title) => (
                      <SelectItem key={title.value} value={title.value}>
                        {title.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Work Location</Label>
                <Select 
                  value={formData.work_location} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, work_location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_LOCATIONS.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{location.label}</span>
                          {location.description && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {location.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Contract Type</Label>
                <Select 
                  value={formData.contract_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oman-unlimited-contract">Oman Unlimited Contract</SelectItem>
                    <SelectItem value="oman-fixed-term-contract">Oman Fixed-Term Contract</SelectItem>
                    <SelectItem value="oman-part-time-contract">Oman Part-Time Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Basic Salary</Label>
                <Input
                  type="number"
                  value={formData.basic_salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, basic_salary: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label>Allowances</Label>
                <Input
                  type="number"
                  value={formData.allowances}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowances: Number(e.target.value) }))}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Generating Contract..." : "Generate Contract with Make.com"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Generation Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800">Error</h3>
                    <p className="text-red-600">{result.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Contract ID</Label>
                        <p className="text-sm">{result.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Contract Number</Label>
                        <p className="text-sm">{result.contract_number}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge variant={result.status === 'processing' ? 'default' : 'secondary'}>
                          {result.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Success</Label>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>

                    {result.message && (
                      <div>
                        <Label className="text-sm font-medium">Message</Label>
                        <p className="text-sm">{result.message}</p>
                      </div>
                    )}

                    {result.pdf_url && (
                      <div>
                        <Label className="text-sm font-medium">PDF URL</Label>
                        <p className="text-sm break-all">{result.pdf_url}</p>
                      </div>
                    )}

                    {result.google_drive_url && (
                      <div>
                        <Label className="text-sm font-medium">Google Drive URL</Label>
                        <p className="text-sm break-all">{result.google_drive_url}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>MAKE_WEBHOOK_URL:</span>
                <Badge variant={process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>GOOGLE_DRIVE_FOLDER_ID:</span>
                <Badge variant={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 