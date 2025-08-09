"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Mail, Lock, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export function EnhancedLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Test Supabase connection on component mount
  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      console.log("🔗 Testing Supabase connection...")
      
      // Simple connection test
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1)

      if (error) {
        console.error("🔗 Supabase connection error:", error)
        setConnectionStatus("error")
      } else {
        console.log("🔗 Supabase connection successful")
        setConnectionStatus("connected")
      }
    } catch (error) {
      console.error("🔗 Supabase connection failed:", error)
      setConnectionStatus("error")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("🔐 Enhanced Login - Starting login process...")
      console.log("🔐 Enhanced Login - Email:", email)
      console.log("🔐 Enhanced Login - Connection status:", connectionStatus)

      // Step 1: Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error("🔐 Enhanced Login - Auth error:", authError)
        
        // Handle specific error types
        let errorMessage = "Authentication failed"
        
        if (authError.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again."
        } else if (authError.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and confirm your account before signing in."
        } else if (authError.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please wait a few minutes before trying again."
        } else if (authError.message.includes("User not found")) {
          errorMessage = "No account found with this email address."
        } else {
          errorMessage = authError.message
        }
        
        throw new Error(errorMessage)
      }

      if (!authData.user) {
        throw new Error("Authentication failed - no user returned")
      }

      console.log("🔐 Enhanced Login - Auth successful, user ID:", authData.user.id)

      // Step 2: Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("id, email, full_name, role, status, company_id")
        .eq("id", authData.user.id)
        .single()

      if (profileError) {
        console.error("🔐 Enhanced Login - Profile fetch error:", profileError)
        throw new Error("Failed to load user profile")
      }

      if (!userProfile) {
        throw new Error("User profile not found")
      }

      console.log("🔐 Enhanced Login - Profile loaded:", userProfile.role, userProfile.status)

      // Step 3: Check user status
      if (userProfile.status === "pending") {
        setError("Your account is pending approval. Please contact an administrator.")
        
        toast({
          title: "Account Pending Approval",
          description: "Your account is under review. You'll be notified once approved.",
          variant: "default",
        })
        return
      }

      if (userProfile.status === "inactive") {
        setError("Your account has been deactivated. Please contact an administrator.")
        
        toast({
          title: "Account Deactivated",
          description: "Your account has been deactivated. Please contact support.",
          variant: "destructive",
        })
        return
      }

      // Step 4: Success - determine redirect URL based on role
      setSuccess("Login successful! Redirecting...")
      
      let redirectUrl = "/en/dashboard"
      
      switch (userProfile.role) {
        case "provider":
          redirectUrl = "/en/dashboard/provider-comprehensive"
          break
        case "client":
          redirectUrl = "/en/dashboard/client-comprehensive"
          break
        case "admin":
        case "super_admin":
          redirectUrl = "/en/dashboard/admin"
          break
        case "manager":
          redirectUrl = "/en/dashboard/manager"
          break
        default:
          redirectUrl = "/en/dashboard"
      }

      console.log("🔐 Enhanced Login - Redirecting to:", redirectUrl)

      toast({
        title: "Login Successful",
        description: `Welcome back, ${userProfile.full_name}!`,
        variant: "default",
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push(redirectUrl)
      }, 1000)

    } catch (error) {
      console.error("🔐 Enhanced Login - Login failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      setError(errorMessage)
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case "connecting":
        return (
          <div className="flex items-center text-yellow-600 text-sm">
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Connecting to server...
          </div>
        )
      case "connected":
        return (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Connected to server
          </div>
        )
      case "error":
        return (
          <div className="flex items-center text-red-600 text-sm">
            <div className="h-4 w-4 mr-2 rounded-full bg-red-500"></div>
            Connection error - please refresh
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Contract Management System
          </CardTitle>
          <CardDescription>
            Sign in to access your dashboard
          </CardDescription>
          
          {/* Connection Status */}
          <div className="mt-4">
            {getConnectionStatusIndicator()}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  className="pl-10"
                  placeholder="Enter your email"
                  disabled={connectionStatus === "error"}
                />
                <Mail className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                  disabled={connectionStatus === "error"}
                />
                <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={connectionStatus === "error"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </Label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => router.push("/en/auth/forgot-password")}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || connectionStatus === "error"}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/en/auth/register")}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create account
                </button>
              </p>
            </div>

            {/* Test Accounts (Development Only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Test Accounts:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>📧 provider@test.com / TestPass123!</div>
                  <div>📧 test@test.com / TestPass123!</div>
                  <div>📧 user@test.com / TestPass123!</div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Server running on: <span className="font-mono">localhost:3001</span>
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}