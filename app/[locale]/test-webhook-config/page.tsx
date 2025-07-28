"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertTriangle, Info, Settings } from "lucide-react"

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function TestWebhookConfigPage() {
  const [webhookUrl, setWebhookUrl] = useState<string>("")
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  const testWebhook = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, error: "Please enter a webhook URL" })
      return
    }

    setIsTesting(true)
    try {
      const testPayload = {
        contract_id: "test-contract-id",
        contract_number: "PAC-TEST-123",
        contract_type: "full-time-permanent",
        test: true
      }

      console.log('🧪 Testing webhook URL:', webhookUrl)
      console.log('📤 Sending test payload:', testPayload)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      })

      console.log('🔗 Webhook response status:', response.status, response.statusText)
      console.log('🔗 Webhook response headers:', Object.fromEntries(response.headers.entries()))

      const result: any = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: webhookUrl
      }

      if (response.ok) {
        // Handle different response types
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const responseData = await response.json()
            result.responseData = responseData
            console.log('✅ Webhook test successful (JSON response):', responseData)
          } catch (jsonError) {
            console.log('⚠️ Webhook response is not valid JSON, but request was successful')
            result.responseText = "Response received but not JSON"
          }
        } else {
          // Handle non-JSON responses (like "Accepted")
          const textResponse = await response.text()
          result.responseText = textResponse
          console.log('✅ Webhook test successful (text response):', textResponse)
        }
      } else {
        console.error('❌ Webhook test failed:', response.status, response.statusText)
        try {
          const errorText = await response.text()
          result.errorText = errorText
        } catch (e) {
          result.errorText = "Could not read error response"
        }
      }

      setTestResult(result)
    } catch (error) {
      console.error('❌ Webhook test error:', error)
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        url: webhookUrl
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Make.com Webhook Configuration Test</h1>
          <p className="text-muted-foreground">
            Test and configure your Make.com webhook URL for contract generation
          </p>
        </div>

        {/* Current Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  The current webhook URL is returning 404 errors. This means the URL is either incorrect or the Make.com scenario is not properly configured.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Current Webhook URL</h3>
                  <Badge variant="destructive">❌ 404 Error</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    https://hook.eu2.make.com/YOUR_NEW_CONTRACT_GENERATION_WEBHOOK_ID
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    This is a placeholder URL - needs to be replaced with real Make.com webhook
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Environment Variable</h3>
                  <Badge variant="secondary">MAKE_WEBHOOK_URL</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Not set or set to placeholder value
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Webhook URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Make.com Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://hook.eu2.make.com/YOUR_ACTUAL_WEBHOOK_ID"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your actual Make.com webhook URL here to test it
                </p>
              </div>
              
              <Button 
                onClick={testWebhook} 
                disabled={isTesting || !webhookUrl}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Testing Webhook...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Test Webhook
                  </>
                )}
              </Button>

              {testResult && (
                <div className="mt-4">
                  {testResult.success ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Webhook Test Successful!</strong>
                        <br />
                        Status: {testResult.status} {testResult.statusText}
                        <br />
                        URL: {testResult.url}
                        {testResult.responseData && (
                          <>
                            <br />
                            Response: {JSON.stringify(testResult.responseData, null, 2)}
                          </>
                        )}
                        {testResult.responseText && (
                          <>
                            <br />
                            Response: {testResult.responseText}
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Webhook Test Failed!</strong>
                        <br />
                        Status: {testResult.status} {testResult.statusText}
                        <br />
                        URL: {testResult.url}
                        {testResult.error && (
                          <>
                            <br />
                            Error: {testResult.error}
                          </>
                        )}
                        {testResult.errorText && (
                          <>
                            <br />
                            Error Details: {testResult.errorText}
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Create Make.com Scenario</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <a href="https://www.make.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Make.com</a></li>
                  <li>Create a new scenario</li>
                  <li>Add an HTTP webhook trigger</li>
                  <li>Copy the webhook URL</li>
                  <li>Add Google Docs module to create document from template</li>
                  <li>Add PDF generation module</li>
                  <li>Add Supabase module to update contract status</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2. Configure Environment Variable</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Add <code>MAKE_WEBHOOK_URL</code> to your environment variables</li>
                  <li>Set it to your actual Make.com webhook URL</li>
                  <li>Restart your application</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3. Test the Integration</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Use the test form above to verify the webhook works</li>
                  <li>Submit a contract through the Enhanced Contract Form</li>
                  <li>Check Make.com scenario execution logs</li>
                  <li>Verify Google Docs document creation</li>
                  <li>Confirm PDF generation and storage</li>
                </ol>
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
                <h3 className="font-semibold mb-2">Common Issues:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>404 Error:</strong> Webhook URL is incorrect or scenario is not active</li>
                  <li><strong>403 Error:</strong> Webhook is not public or requires authentication</li>
                  <li><strong>500 Error:</strong> Make.com scenario has an error</li>
                  <li><strong>Timeout:</strong> Scenario is taking too long to respond</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Make.com Scenario Requirements:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>HTTP webhook trigger must be public</li>
                  <li>Scenario must be active (not paused)</li>
                  <li>Google Docs template must exist and be accessible</li>
                  <li>Service account must have proper permissions</li>
                  <li>Supabase connection must be configured</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 