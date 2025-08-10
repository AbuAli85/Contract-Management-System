"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Loader2, User, Building, CheckCircle, AlertTriangle } from "lucide-react"

type UserRole = 'provider' | 'client' | 'admin' | 'user'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  role: UserRole
  phone: string
  company?: string
}

export default function SimpleRegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'provider',
    phone: '',
    company: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [userId, setUserId] = useState<string>('')
  
  const router = useRouter()
  const supabase = createClient()

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.fullName || !formData.role) {
      return "Please fill in all required fields"
    }
    
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long"
    }
    
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match"
    }
    
    if (!formData.email.includes('@')) {
      return "Please enter a valid email address"
    }
    
    return null
  }

  const handleRegister = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("🔐 Simple Registration - Starting:", formData.email, formData.role)

      // Step 1: Create auth user using standard signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            phone: formData.phone,
            company: formData.company
          }
        }
      })

      if (authError) {
        console.error("❌ Auth signup error:", authError)
        setError(`Registration failed: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError("❌ No user data returned from registration")
        return
      }

      console.log("✅ Auth signup successful:", authData.user.id)
      setUserId(authData.user.id)

      // Step 2: Create public user record manually using direct insert
      try {
        const { error: publicUserError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
            status: 'active',
            phone: formData.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (publicUserError) {
          console.error("⚠️ Public user creation error:", publicUserError)
          setMessage(`✅ Account created successfully! 
          
Note: User profile sync may need manual setup in database.
Auth User ID: ${authData.user.id}
Email: ${formData.email}
Role: ${formData.role}`)
        } else {
          console.log("✅ Public user record created successfully")
          setMessage(`✅ Registration completely successful! 
          
Account created for ${formData.email} with ${formData.role} role.`)
        }
      } catch (publicError) {
        console.error("⚠️ Public user error:", publicError)
        setMessage(`✅ Auth account created successfully! 
        
Note: Database sync encountered an issue, but your account exists.
You can try logging in with: ${formData.email}`)
      }

      setStep('success')

    } catch (error) {
      console.error("❌ Registration error:", error)
      setError(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    router.push('/en/working-login')
  }

  const goToDashboard = () => {
    const dashboardPath = formData.role === 'provider' 
      ? '/en/dashboard/provider-comprehensive'
      : formData.role === 'client'
      ? '/en/dashboard/client-comprehensive'
      : '/en/dashboard'
    
    window.location.href = dashboardPath
  }

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const createManualAccount = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // Try to create manual database entry
      const response = await fetch('/api/auth/manual-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          phone: formData.phone
        })
      })
      
      if (response.ok) {
        setMessage("✅ Manual sync successful! Account is now fully set up.")
      } else {
        setError("❌ Manual sync failed. Please contact support.")
      }
    } catch (err) {
      setError("❌ Manual sync error. Account exists but may need admin setup.")
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-900">Registration Successful!</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                <div className="space-y-2 text-sm">
                  <p><strong>Account Details:</strong></p>
                  <p>📧 Email: {formData.email}</p>
                  <p>👤 Name: {formData.fullName}</p>
                  <p>🎯 Role: {formData.role}</p>
                  <p>🆔 User ID: {userId}</p>
                  <p>✅ Status: Ready to use</p>
                </div>
              </AlertDescription>
            </Alert>

            {message && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm whitespace-pre-line">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleLogin}
              >
                🔐 Go to Login Page
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={goToDashboard}
              >
                📊 Try Dashboard Access
              </Button>
              
              {userId && (
                <Button
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700"
                  onClick={createManualAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Manual Sync...
                    </>
                  ) : (
                    "🔧 Manual Database Sync"
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('/en/dashboard-preview', '_blank')}
              >
                👁️ View Dashboard Demo
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center border-t pt-2">
              <p>Your account is created! Try logging in with your credentials.</p>
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
          <CardTitle className="text-2xl">✅ Simple Registration</CardTitle>
          <p className="text-sm text-gray-600">Working registration system without complex APIs</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <Label htmlFor="role">Account Type *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => updateFormData('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="provider">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Provider - Offer services
                    </div>
                  </SelectItem>
                  <SelectItem value="client">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Client - Book services
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Admin - Full access
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User - Basic access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {formData.role === 'provider' && "✅ Direct Supabase auth + manual DB sync"}
                  {formData.role === 'client' && "✅ Working client account creation"}
                  {formData.role === 'admin' && "✅ Admin account with full access"}
                  {formData.role === 'user' && "✅ Basic user account"}
                </Badge>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            {/* Company field for providers/clients */}
            {(formData.role === 'provider' || formData.role === 'client') && (
              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Repeat your password"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "✅ Create Account"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => router.push('/en/working-login')}
                className="text-sm"
              >
                Already have an account? Login here
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center border-t pt-2">
            <p>✅ Uses standard Supabase signup (no admin APIs)</p>
            <p>✅ Manual database sync if needed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}