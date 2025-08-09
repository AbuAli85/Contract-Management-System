"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestAuthPage() {
  const [connectionTest, setConnectionTest] = useState<string>("Testing...")
  const [authTest, setAuthTest] = useState<string>("Not tested")
  const [accountCheck, setAccountCheck] = useState<string>("Not checked")
  const [loginTest, setLoginTest] = useState<string>("Not tested")
  const [testEmail, setTestEmail] = useState("provider@test.com")
  const [testPassword, setTestPassword] = useState("TestPass123!")
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    testConnection()
    checkAccounts()
  }, [])

  const testConnection = async () => {
    try {
      console.log("🔗 Testing Supabase connection...")
      
      // Test basic connection
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1)

      if (error) {
        setConnectionTest(`❌ Failed: ${error.message}`)
      } else {
        setConnectionTest("✅ Connected successfully")
      }
    } catch (error) {
      setConnectionTest(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const checkAccounts = async () => {
    try {
      console.log("👤 Checking test accounts...")
      
      // Check if test accounts exist
      const { data: authUsers, error: authError } = await supabase
        .from("users")
        .select("email, role, status")
        .in("email", ["provider@test.com", "test@test.com", "user@test.com"])

      if (authError) {
        setAccountCheck(`❌ Failed: ${authError.message}`)
      } else {
        const accountList = authUsers?.map(u => `${u.email} (${u.role})`).join(", ") || "None"
        setAccountCheck(`✅ Found: ${accountList}`)
      }
    } catch (error) {
      setAccountCheck(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setLoginTest("Testing...")
    
    try {
      console.log("🔐 Testing login with:", testEmail)
      
      // Test login with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (error) {
        setLoginTest(`❌ Login failed: ${error.message}`)
        setAuthTest(`❌ Auth error: ${error.message}`)
      } else if (data.user) {
        setLoginTest(`✅ Login successful! User ID: ${data.user.id}`)
        setAuthTest(`✅ Auth successful: ${data.user.email}`)
        
        // Test logout
        await supabase.auth.signOut()
      } else {
        setLoginTest("❌ Login failed: No user returned")
        setAuthTest("❌ Auth failed: No user data")
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setLoginTest(`❌ Error: ${errorMsg}`)
      setAuthTest(`❌ Exception: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestAccount = async () => {
    setLoading(true)
    
    try {
      console.log("👤 Creating test account...")
      
      // First try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: "Test User",
            role: "provider"
          }
        }
      })

      if (signUpError) {
        console.error("Sign up error:", signUpError)
        
        // If user already exists, that's actually good for testing
        if (signUpError.message.includes("already registered")) {
          setAccountCheck("✅ Account already exists (good for testing)")
        } else {
          setAccountCheck(`❌ Sign up failed: ${signUpError.message}`)
        }
      } else if (signUpData.user) {
        setAccountCheck(`✅ Account created: ${signUpData.user.id}`)
        
        // Create public user profile
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: signUpData.user.id,
            email: testEmail,
            full_name: "Test User",
            role: "provider",
            status: "active"
          })

        if (profileError) {
          console.warn("Profile creation warning:", profileError)
        }
      }
    } catch (error) {
      setAccountCheck(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Authentication System Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Environment Info */}
            <Alert>
              <AlertDescription>
                <strong>Server:</strong> localhost:3001<br/>
                <strong>Environment:</strong> {process.env.NODE_ENV}<br/>
                <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}
              </AlertDescription>
            </Alert>

            {/* Connection Test */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔗 Connection Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{connectionTest}</p>
                  <Button 
                    onClick={testConnection} 
                    className="mt-2 w-full"
                    variant="outline"
                  >
                    Retest Connection
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">👤 Account Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{accountCheck}</p>
                  <Button 
                    onClick={checkAccounts} 
                    className="mt-2 w-full"
                    variant="outline"
                  >
                    Recheck Accounts
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Login Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔐 Login Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testEmail">Test Email</Label>
                    <Input
                      id="testEmail"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter test email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testPassword">Test Password</Label>
                    <Input
                      id="testPassword"
                      type="password"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      placeholder="Enter test password"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm"><strong>Auth Test:</strong> {authTest}</p>
                  <p className="text-sm"><strong>Login Test:</strong> {loginTest}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={testLogin} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Testing..." : "Test Login"}
                  </Button>
                  <Button 
                    onClick={createTestAccount} 
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading ? "Creating..." : "Create Test Account"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Test Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚡ Quick Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button 
                    onClick={() => {
                      setTestEmail("provider@test.com")
                      setTestPassword("TestPass123!")
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Provider Account
                  </Button>
                  <Button 
                    onClick={() => {
                      setTestEmail("test@test.com")
                      setTestPassword("TestPass123!")
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Test Account
                  </Button>
                  <Button 
                    onClick={() => {
                      setTestEmail("user@test.com")
                      setTestPassword("TestPass123!")
                    }}
                    variant="outline"
                    size="sm"
                  >
                    User Account
                  </Button>
                  <Button 
                    onClick={() => {
                      setTestEmail("admin@test.com")
                      setTestPassword("TestPass123!")
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Admin Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🚀 Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.href = '/en/auth/login'}
                    className="flex-1"
                  >
                    Go to Login Page
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/en/auth/register'}
                    variant="outline"
                    className="flex-1"
                  >
                    Go to Register Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}