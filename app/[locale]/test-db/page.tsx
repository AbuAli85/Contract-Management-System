"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TestResult {
  success: boolean
  message?: string
  error?: string
  details?: string
  hasSession?: boolean
  userEmail?: string
  timestamp?: string
}

interface Contract {
  id: string
  contract_number: string
  job_title: string
  status: string
  created_at: string
}

export default function TestDbPage() {
  const [dbTest, setDbTest] = useState<TestResult | null>(null)
  const [contractsTest, setContractsTest] = useState<TestResult | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      setDbTest(data)
    } catch (error) {
      setDbTest({
        success: false,
        error: 'Failed to test database',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testContracts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contracts')
      const data = await response.json()
      setContractsTest(data)
      
      if (data.success && data.contracts) {
        setContracts(data.contracts)
      }
    } catch (error) {
      setContractsTest({
        success: false,
        error: 'Failed to fetch contracts',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testDatabase()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Test Page</h1>
        <p className="text-muted-foreground">
          Test database connectivity and API endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
            <CardDescription>
              Test basic database connectivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testDatabase} disabled={loading}>
              {loading ? 'Testing...' : 'Test Database'}
            </Button>
            
            {dbTest && (
              <div className={`p-4 rounded-lg ${dbTest.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={dbTest.success ? "default" : "destructive"}>
                    {dbTest.success ? 'Success' : 'Error'}
                  </Badge>
                  {dbTest.timestamp && (
                    <span className="text-sm text-muted-foreground">
                      {new Date(dbTest.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="font-medium">{dbTest.message || dbTest.error}</p>
                {dbTest.details && (
                  <p className="text-sm text-muted-foreground mt-1">{dbTest.details}</p>
                )}
                {dbTest.hasSession !== undefined && (
                  <p className="text-sm mt-2">
                    <strong>Session:</strong> {dbTest.hasSession ? 'Yes' : 'No'}
                  </p>
                )}
                {dbTest.userEmail && (
                  <p className="text-sm">
                    <strong>User:</strong> {dbTest.userEmail}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contracts API Test</CardTitle>
            <CardDescription>
              Test contracts API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testContracts} disabled={loading}>
              {loading ? 'Testing...' : 'Test Contracts API'}
            </Button>
            
            {contractsTest && (
              <div className={`p-4 rounded-lg ${contractsTest.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={contractsTest.success ? "default" : "destructive"}>
                    {contractsTest.success ? 'Success' : 'Error'}
                  </Badge>
                </div>
                <p className="font-medium">{contractsTest.message || contractsTest.error}</p>
                {contractsTest.details && (
                  <p className="text-sm text-muted-foreground mt-1">{contractsTest.details}</p>
                )}
                {contractsTest.success && contracts && (
                  <p className="text-sm mt-2">
                    <strong>Contracts found:</strong> {contracts.length}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Contracts</CardTitle>
            <CardDescription>
              First 5 contracts from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{contract.contract_number}</h3>
                    <p className="text-sm text-muted-foreground">{contract.job_title}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{contract.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            What to do based on test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>If Database Test Fails:</strong> Check Supabase connection and environment variables
            </p>
            <p className="text-sm">
              <strong>If Contracts API Fails:</strong> Check authentication setup and user session
            </p>
            <p className="text-sm">
              <strong>If Both Pass:</strong> The system is working correctly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 