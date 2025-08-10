"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, Database, Users, Building } from "lucide-react"

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export default function TestRegistrationPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    // Check current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user)
      }
    })
  }, [supabase])

  const runSystemTests = async () => {
    setLoading(true)
    setTestResults([])
    
    const results: TestResult[] = []

    try {
      // Test 1: Database Connection
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1)
        if (error) {
          results.push({
            name: "Database Connection",
            status: 'error',
            message: "Failed to connect to database",
            details: error.message
          })
        } else {
          results.push({
            name: "Database Connection",
            status: 'success',
            message: "Successfully connected to Supabase"
          })
        }
      } catch (err) {
        results.push({
          name: "Database Connection",
          status: 'error',
          message: "Connection error",
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      }

      // Test 2: Users Table Structure
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, status')
          .limit(1)
        
        if (error) {
          results.push({
            name: "Users Table",
            status: 'error',
            message: "Users table structure issue",
            details: error.message
          })
        } else {
          results.push({
            name: "Users Table",
            status: 'success',
            message: "Users table structure is correct"
          })
        }
      } catch (err) {
        results.push({
          name: "Users Table",
          status: 'error',
          message: "Users table error",
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      }

      // Test 3: Companies Table
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, type, status')
          .limit(1)
        
        if (error) {
          results.push({
            name: "Companies Table",
            status: 'warning',
            message: "Companies table may not exist",
            details: error.message
          })
        } else {
          results.push({
            name: "Companies Table",
            status: 'success',
            message: "Companies table is available"
          })
        }
      } catch (err) {
        results.push({
          name: "Companies Table",
          status: 'warning',
          message: "Companies table not available",
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      }

      // Test 4: Auth Functions
      try {
        const { data } = await supabase.auth.getSession()
        results.push({
          name: "Auth System",
          status: 'success',
          message: `Auth system working. Current session: ${data.session ? 'Active' : 'None'}`
        })
      } catch (err) {
        results.push({
          name: "Auth System",
          status: 'error',
          message: "Auth system error",
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      }

      // Test 5: Registration API
      try {
        const response = await fetch('/api/auth/register-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test-api@example.com',
            password: 'testpassword123',
            fullName: 'API Test User',
            role: 'user',
            phone: '+1234567890'
          })
        })
        
        if (response.ok) {
          results.push({
            name: "Registration API",
            status: 'success',
            message: "Registration API is working"
          })
          
          // Clean up test user
          try {
            await supabase.from('users').delete().eq('email', 'test-api@example.com')
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
        } else {
          const errorData = await response.json()
          results.push({
            name: "Registration API",
            status: 'error',
            message: "Registration API error",
            details: errorData.error || 'Unknown API error'
          })
        }
      } catch (err) {
        results.push({
          name: "Registration API",
          status: 'error',
          message: "Registration API unavailable",
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      }

    } catch (globalError) {
      results.push({
        name: "System Test",
        status: 'error',
        message: "Global system error",
        details: globalError instanceof Error ? globalError.message : 'Unknown error'
      })
    }

    setTestResults(results)
    setLoading(false)
  }

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">✅ Pass</Badge>
      case 'error':
        return <Badge variant="destructive">❌ Fail</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">⚠️ Warning</Badge>
    }
  }

  const openRegistration = () => {
    window.open('/en/register-new', '_blank')
  }

  const openLogin = () => {
    window.open('/en/working-login', '_blank')
  }

  const openSchemaSetup = () => {
    window.open('https://reootcngcptfogfozlmz.supabase.co/project/reootcngcptfogfozlmz/sql/new', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <Database className="h-8 w-8 text-blue-600" />
              Registration System Test
            </CardTitle>
            <p className="text-gray-600">
              Test and validate the new user registration system
            </p>
          </CardHeader>
        </Card>

        {/* Current User Status */}
        {currentUser && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Current Session</h3>
                  <p className="text-sm text-blue-700">
                    Logged in as: {currentUser.email}
                  </p>
                </div>
                <Badge className="bg-blue-600">Active Session</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>System Tests</CardTitle>
            <p className="text-sm text-gray-600">
              Run comprehensive tests to ensure registration system is working
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runSystemTests}
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? "Running Tests..." : "🧪 Run System Tests"}
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Test Results:</h3>
                {testResults.map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-gray-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                          {result.details}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Before testing registration:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Run the setup script in Supabase SQL Editor</li>
                      <li>Ensure all tables and constraints are created</li>
                      <li>Run system tests to verify everything works</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                
                <Button onClick={openSchemaSetup} className="w-full">
                  🔧 Open Supabase SQL Editor
                </Button>
                
                <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
                  <p><strong>Script to run:</strong> scripts/setup-registration-system.sql</p>
                  <p>This script creates all necessary tables, enums, and constraints.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  New User Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create new user accounts with proper role assignment and database integration.
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Available Roles:</h4>
                    <ul className="space-y-1">
                      <li>• Provider - Offer services</li>
                      <li>• Client - Book services</li>
                      <li>• Admin - Full access</li>
                      <li>• User - Basic access</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Features:</h4>
                    <ul className="space-y-1">
                      <li>• Auto-confirmed accounts</li>
                      <li>• Proper role assignment</li>
                      <li>• Company integration</li>
                      <li>• Database sync</li>
                    </ul>
                  </div>
                </div>
                
                <Button onClick={openRegistration} className="w-full">
                  👥 Open Registration Page
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="login" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Test Login
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  After creating accounts, test login functionality and dashboard access.
                </p>
                
                <Button onClick={openLogin} className="w-full">
                  🔐 Open Login Page
                </Button>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Test Flow:</strong></p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Register new account</li>
                    <li>Login with new credentials</li>
                    <li>Access role-specific dashboard</li>
                    <li>Verify all features work</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}