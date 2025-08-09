"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Database, RefreshCw } from 'lucide-react'

interface SchemaCheck {
  exists: boolean
  error: string | null
}

interface SchemaChecks {
  bookings_table: SchemaCheck
  column_booking_number: SchemaCheck
  column_scheduled_start: SchemaCheck
  column_scheduled_end: SchemaCheck
  unique_constraint_booking_number: SchemaCheck
  upsert_functionality: SchemaCheck & { works?: boolean }
  [key: string]: any
}

export default function TestBookingFixedPage() {
  const [schemaChecks, setSchemaChecks] = useState<SchemaChecks | null>(null)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const checkSchema = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/booking-schema')
      const data = await response.json()
      setSchemaChecks(data.schemaChecks)
    } catch (error) {
      console.error('Failed to check schema:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFix = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/apply-booking-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      setTestResult(result)
      
      if (result.success) {
        // Refresh schema check after successful fix
        setTimeout(() => {
          checkSchema()
        }, 1000)
      }
    } catch (error) {
      setTestResult({ error: 'Fix failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  const testUpsert = async () => {
    setLoading(true)
    try {
      const testPayload = {
        service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
        provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
        client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
        scheduled_start: new Date(Date.now() + 4*24*60*60*1000).toISOString(),
        scheduled_end: new Date(Date.now() + 4*24*60*60*1000 + 2*60*60*1000).toISOString(),
        total_price: 25.000,
        currency: 'OMR',
        booking_number: 'BK-TEST-' + Date.now(),
        status: 'pending',
        notes: 'Test booking from UI'
      }

      const response = await fetch('/api/bookings/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: 'Test failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSchema()
  }, [])

  const getStatusIcon = (check: SchemaCheck | undefined) => {
    if (!check) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return check.exists ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (check: SchemaCheck | undefined) => {
    if (!check) return <Badge variant="secondary">Unknown</Badge>
    return check.exists ? 
      <Badge variant="default">✅ OK</Badge> : 
      <Badge variant="destructive">❌ Missing</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Booking System Status</h1>
        <p className="text-gray-600">Review and fix booking upsert implementation</p>
      </div>

      {/* Schema Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Schema Status
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={checkSchema} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schemaChecks ? (
            <div className="space-y-4">
              {/* Core Requirements */}
              <div>
                <h3 className="font-semibold mb-2">Core Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(schemaChecks.bookings_table)}
                      Bookings Table
                    </span>
                    {getStatusBadge(schemaChecks.bookings_table)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(schemaChecks.column_booking_number)}
                      booking_number Column
                    </span>
                    {getStatusBadge(schemaChecks.column_booking_number)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(schemaChecks.column_scheduled_start)}
                      scheduled_start Column
                    </span>
                    {getStatusBadge(schemaChecks.column_scheduled_start)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(schemaChecks.column_scheduled_end)}
                      scheduled_end Column
                    </span>
                    {getStatusBadge(schemaChecks.column_scheduled_end)}
                  </div>
                </div>
              </div>

              {/* Critical Features */}
              <div>
                <h3 className="font-semibold mb-2">Critical Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(schemaChecks.unique_constraint_booking_number)}
                      Unique Constraint (booking_number)
                    </span>
                    {getStatusBadge(schemaChecks.unique_constraint_booking_number)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {schemaChecks.upsert_functionality?.works ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />}
                      Upsert Functionality
                    </span>
                    {schemaChecks.upsert_functionality?.works ? 
                      <Badge variant="default">✅ Working</Badge> : 
                      <Badge variant="destructive">❌ Broken</Badge>}
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {Object.entries(schemaChecks).some(([_, check]) => check?.error) && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Issues Found</h3>
                  <div className="space-y-2">
                    {Object.entries(schemaChecks).map(([key, check]) => 
                      check?.error && (
                        <Alert key={key} variant="destructive">
                          <AlertDescription>
                            <strong>{key.replace(/_/g, ' ')}:</strong> {check.error}
                          </AlertDescription>
                        </Alert>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p>Click "Refresh" to check database schema</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Upsert */}
      <Card>
        <CardHeader>
          <CardTitle>Test Upsert Functionality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Test the booking upsert functionality with real data to verify everything works correctly.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={applyFix} 
              disabled={loading} 
              variant="default"
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              🔧 Apply Schema Fix
            </Button>
            
            <Button 
              onClick={testUpsert} 
              disabled={loading} 
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              🧪 Test Upsert
            </Button>
          </div>

          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Fix Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                If you see issues above, run the migration to fix the database schema:
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Option 1: Automated Fix Script</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded">
                  <pre className="text-sm">
{`# Run the automated fix script
node scripts/apply-booking-fix.js`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Option 2: Manual SQL Migration</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded">
                  <pre className="text-sm">
{`# Apply the schema fix migration manually
psql -h [your-host] -U [user] -d [database] -f supabase/migrations/20250117_fix_booking_issues.sql

# Or using Supabase CLI
supabase db push`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Option 3: Supabase Dashboard</h4>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <p>1. Go to your Supabase project dashboard</p>
                  <p>2. Navigate to SQL Editor</p>
                  <p>3. Copy and paste the content of <code>supabase/migrations/20250117_fix_booking_issues.sql</code></p>
                  <p>4. Execute the SQL</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What the migration does:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Adds unique constraint on <code>booking_number</code></li>
                <li>Adds <code>scheduled_start</code> and <code>scheduled_end</code> columns</li>
                <li>Creates backward compatibility triggers</li>
                <li>Adds proper indexes for performance</li>
                <li>Creates unified view for schema compatibility</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}