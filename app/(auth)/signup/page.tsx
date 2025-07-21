'use client'

import { SignUpForm } from '@/src/components/auth/signup-form'
import { OAuthButtons } from '@/src/components/auth/oauth-buttons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SignUpForm />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <OAuthButtons />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
