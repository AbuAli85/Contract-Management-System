"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, ArrowLeft, Users, Shield, Award, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CompanyProfileForm } from '@/components/registration/company-profile-form'
import { useAuth } from '@/lib/auth-service'
import type { CompanyProfile } from '@/types/company'

export default function ProviderRegistrationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/login?redirect=/register/provider')
      return
    }
    setIsLoading(false)
  }, [user, router])

  const handleRegistrationSuccess = (data: CompanyProfile) => {
    setRegistrationComplete(true)
    
    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
  }

  const handleRegistrationError = (error: string) => {
    console.error('Registration error:', error)
    // Error is handled by the form component
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-green-100 p-3 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                Registration Successful!
              </CardTitle>
              <CardDescription>
                Your service provider profile has been created successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Your profile is pending verification. You'll receive an email notification once approved.
                  You will be redirected to the dashboard shortly.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-sm">What's Next?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Profile created and submitted for review
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-orange-500 animate-pulse" />
                    Admin verification (1-2 business days)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    Add your service portfolio
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    Start managing promoters and contracts
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full mt-6"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="h-8 w-8 text-green-600" />
                Service Provider Registration
              </h1>
              <p className="text-muted-foreground">
                Register your company to offer services and manage promoters
              </p>
            </div>
          </div>

          {/* Provider Benefits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/50 border-green-200">
              <CardHeader className="text-center pb-4">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Promoter Management</CardTitle>
                <CardDescription className="text-sm">
                  Manage your workforce and track performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/50 border-blue-200">
              <CardHeader className="text-center pb-4">
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Contract Security</CardTitle>
                <CardDescription className="text-sm">
                  Secure contracts with verified clients
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/50 border-purple-200">
              <CardHeader className="text-center pb-4">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Quality Assurance</CardTitle>
                <CardDescription className="text-sm">
                  Build reputation through quality service delivery
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/50 border-orange-200">
              <CardHeader className="text-center pb-4">
                <Settings className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Business Tools</CardTitle>
                <CardDescription className="text-sm">
                  Access advanced business management tools
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Services offered preview */}
          <Card className="mb-8 bg-white/70">
            <CardHeader>
              <CardTitle className="text-lg">Available Service Categories</CardTitle>
              <CardDescription>
                Select from these service categories when completing your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  'Labor Supply',
                  'Technical Services', 
                  'Consulting',
                  'Training',
                  'Maintenance',
                  'Security',
                  'Cleaning',
                  'Catering',
                  'Transportation',
                  'IT Services'
                ].map((service) => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Form */}
        <CompanyProfileForm
          userId={user.id}
          role="provider"
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
        />

        {/* Requirements section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/70">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Verification Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Valid Commercial Registration (CR)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Business License (if applicable)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Tax Registration Certificate
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Company Bank Account Details
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Insurance Certificates (if required)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/70">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Provider Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    Access to verified client network
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    Secure payment processing
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    Contract management tools
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    Performance analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    Business growth support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Help section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-white/70">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription>
                Our team is here to assist you with the registration process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  For assistance with registration or any questions about becoming a service provider:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" size="sm">
                    📧 providers@contractmanagement.om
                  </Button>
                  <Button variant="outline" size="sm">
                    📞 +968 XX XX XXXX
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
