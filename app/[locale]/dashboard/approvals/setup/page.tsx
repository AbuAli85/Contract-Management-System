"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Database, Settings } from 'lucide-react'

export default function ApprovalSetupPage() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testDatabase = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-approval-workflow')
      const data = await response.json()

      if (data.success) {
        setTestResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError('Failed to test database')
      console.error('Test error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTableStatus = (tableData: any) => {
    if (tableData.error) {
      return { status: 'error', message: tableData.error }
    }
    if (tableData.count > 0) {
      return { status: 'success', message: `${tableData.count} records found` }
    }
    return { status: 'warning', message: 'No data found' }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Approval Workflow Setup</h1>
          <p className="text-muted-foreground">
            Test and configure the approval workflow database
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Test
            </CardTitle>
            <CardDescription>
              Test database connectivity and table structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testDatabase} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Database'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Steps to set up the approval workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p>1. Run the database setup script</p>
              <p>2. Test database connectivity</p>
              <p>3. Configure reviewer roles</p>
              <p>4. Test the approval workflow</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Database Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(testResult.data).map(([tableName, tableData]: [string, any]) => {
                  const status = getTableStatus(tableData)
                  return (
                    <div key={tableName} className="border rounded-lg p-4">
                      <h3 className="font-medium capitalize">{tableName.replace(/([A-Z])/g, ' $1')}</h3>
                      <div className={`mt-2 text-sm ${
                        status.status === 'success' ? 'text-green-600' :
                        status.status === 'error' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {status.message}
                      </div>
                    </div>
                  )
                })}
              </div>

              {testResult.summary && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Tables:</span>
                      <span className="ml-2 font-medium">{testResult.summary.totalTables}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tables with Data:</span>
                      <span className="ml-2 font-medium">{testResult.summary.tablesWithData}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tables with Errors:</span>
                      <span className="ml-2 font-medium">{testResult.summary.tablesWithErrors}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 