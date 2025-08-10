"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

export default function BasicSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("🔐 Basic Signup - Starting for:", email)

      // Use the most basic Supabase signup
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'provider' // Default to provider for dashboard access
          }
        }
      })

      if (error) {
        console.error("❌ Signup error:", error)
        setError(`Signup failed: ${error.message}`)
        return
      }

      if (!data.user) {
        setError("❌ No user data returned")
        return
      }

      console.log("✅ Signup successful:", data.user)
      setUserInfo(data.user)
      setSuccess(true)
      setMessage(`✅ Account created successfully!
      
Email: ${email}
User ID: ${data.user.id}
Status: ${data.user.email_confirmed_at ? 'Confirmed' : 'Pending confirmation'}

You can now try logging in!`)

    } catch (error) {
      console.error("❌ Signup error:", error)
      setError(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const goToLogin = () => {
    router.push('/en/working-login')
  }

  const tryDashboard = () => {
    window.location.href = '/en/dashboard/provider-comprehensive'
  }

  const viewDemo = () => {
    window.location.href = '/en/dashboard-preview'
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-900">Account Created!</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 text-sm whitespace-pre-line">
                {message}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={goToLogin}
              >
                🔐 Go to Login Page
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={tryDashboard}
              >
                📊 Try Provider Dashboard
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={viewDemo}
              >
                👁️ View Dashboard Demo
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center border-t pt-3">
              <p><strong>Next Steps:</strong></p>
              <p>1. Login with your credentials</p>
              <p>2. Access the provider dashboard</p>
              <p>3. Explore all features</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🚀 Basic Signup</CardTitle>
          <p className="text-sm text-gray-600">
            Simplest working registration - just creates auth account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "🚀 Create Account"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={goToLogin}
                className="text-sm"
              >
                Already have an account? Login here
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center border-t pt-3 space-y-1">
            <p>✅ Uses only standard Supabase auth</p>
            <p>✅ No complex database operations</p>
            <p>✅ Automatic provider role assignment</p>
            <p>✅ Works with existing login system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}