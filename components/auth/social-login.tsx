"use client"

import React, { useState } from "react"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Github, Chrome, Mail, AlertCircle, Loader2, Shield, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

interface SocialLoginProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  showEmailOption?: boolean
  providers?: ("github" | "google")[]
}

interface ProviderConfig {
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  description: string
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  github: {
    name: "GitHub",
    icon: Github,
    color: "text-white",
    bgColor: "bg-gray-900 hover:bg-gray-800",
    description: "Sign in with your GitHub account",
  },
  google: {
    name: "Google",
    icon: Chrome,
    color: "text-gray-700",
    bgColor: "bg-white hover:bg-gray-50 border border-gray-300",
    description: "Sign in with your Google account",
  },
  microsoft: {
    name: "Microsoft",
    icon: Mail,
    color: "text-white",
    bgColor: "bg-blue-600 hover:bg-blue-700",
    description: "Sign in with your Microsoft account",
  },
  discord: {
    name: "Discord",
    icon: Shield,
    color: "text-white",
    bgColor: "bg-indigo-600 hover:bg-indigo-700",
    description: "Sign in with your Discord account",
  },
}

type SupportedProvider = "github" | "google"

export function SocialLogin({
  onSuccess,
  onError,
  showEmailOption = true,
  providers = ["github", "google"],
}: SocialLoginProps) {
  const { signInWithProvider } = useAuth()
  const [loading, setLoading] = useState<SupportedProvider | null>(null)
  const [error, setError] = useState<string>("")

  // Filter available providers - simple auth provider only supports github and google
  const availableProviders = providers.filter((provider) =>
    ["github", "google"].includes(provider),
  ) as SupportedProvider[]

  const handleSocialLogin = async (provider: SupportedProvider) => {
    setLoading(provider)
    setError("")

    try {
      const result = await signInWithProvider(provider)

      if (result.success) {
        toast.success(`Redirecting to ${PROVIDER_CONFIGS[provider]?.name || provider}...`)
        onSuccess?.()
      } else {
        const errorMessage = result.error || `Failed to sign in with ${provider}`
        setError(errorMessage)
        onError?.(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      const errorMessage = `An unexpected error occurred while signing in with ${provider}`
      console.error("Social login error:", error)
      setError(errorMessage)
      onError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  if (availableProviders.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Social Login</CardTitle>
          <CardDescription className="text-center">
            No social login providers are currently available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Social login providers need to be configured in your Supabase project settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Choose your preferred sign-in method
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {availableProviders.map((provider) => {
            const config = PROVIDER_CONFIGS[provider]
            if (!config) return null

            const Icon = config.icon

            return (
              <Button
                key={provider}
                variant="outline"
                className={`h-12 w-full ${config.bgColor} ${config.color} justify-start gap-3`}
                onClick={() => handleSocialLogin(provider)}
                disabled={loading !== null}
              >
                {loading === provider ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="flex-1 text-left">Continue with {config.name}</span>
              </Button>
            )
          })}
        </div>

        {showEmailOption && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="h-12 w-full" onClick={() => onSuccess?.()}>
              <Mail className="mr-3 h-5 w-5" />
              Continue with Email
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced social login with provider status
export function SocialLoginWithStatus({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: string) => void
}) {
  const { signInWithProvider } = useAuth()
  const [loading, setLoading] = useState<SupportedProvider | null>(null)
  const [error, setError] = useState<string>("")

  // Filter available providers - simple auth provider only supports github and google
  const availableProviders = ["github", "google"] as SupportedProvider[]

  const handleSocialLogin = async (provider: SupportedProvider) => {
    setLoading(provider)
    setError("")

    try {
      const result = await signInWithProvider(provider)

      if (result.success) {
        toast.success(`Redirecting to ${PROVIDER_CONFIGS[provider]?.name || provider}...`)
        onSuccess?.()
      } else {
        const errorMessage = result.error || `Failed to sign in with ${provider}`
        setError(errorMessage)
        onError?.(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      const errorMessage = `An unexpected error occurred while signing in with ${provider}`
      console.error("Social login error:", error)
      setError(errorMessage)
      onError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Welcome Back</h2>
        <p className="mt-2 text-gray-600">Sign in to your account</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {availableProviders.map((provider) => {
          const config = PROVIDER_CONFIGS[provider]
          if (!config) return null

          const Icon = config.icon
          const isAvailable = true // In a real app, you'd check provider availability
          const providerKey = provider as SupportedProvider

          return (
            <div key={provider} className="space-y-2">
              <Button
                variant="outline"
                className={`h-12 w-full ${config.bgColor} ${config.color} justify-start gap-3`}
                onClick={() => handleSocialLogin(providerKey)}
                disabled={loading !== null || !isAvailable}
              >
                {loading === providerKey ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="flex-1 text-left">Continue with {config.name}</span>
                {isAvailable && (
                  <Badge variant="secondary" className="text-xs">
                    Available
                  </Badge>
                )}
              </Button>

              {!isAvailable && (
                <p className="ml-4 text-xs text-gray-500">
                  {config.name} login is not currently available
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <Button variant="outline" className="h-12 w-full" onClick={() => onSuccess?.()}>
        <Mail className="mr-3 h-5 w-5" />
        Continue with Email
      </Button>
    </div>
  )
}

// Social login success component
export function SocialLoginSuccess({ provider, user }: { provider: string; user: any }) {
  const config = PROVIDER_CONFIGS[provider]

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle>Welcome!</CardTitle>
        <CardDescription>Successfully signed in with {config?.name || provider}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Account Information</Label>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Provider:</strong> {config?.name || provider}
            </div>
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your account is now connected to {config?.name || provider}. You can use this method to
            sign in in the future.
          </AlertDescription>
        </Alert>

        <Button className="w-full">Continue to Dashboard</Button>
      </CardContent>
    </Card>
  )
}

// Provider status component
export function ProviderStatus() {
  // Simple auth provider only supports github and google
  const availableProviders = ["github", "google"] as SupportedProvider[]

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Social Login Providers</CardTitle>
        <CardDescription className="text-center">
          Available authentication providers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {availableProviders.map((provider) => {
          const config = PROVIDER_CONFIGS[provider]
          if (!config) return null

          const Icon = config.icon

          return (
            <div key={provider} className="flex items-center justify-between rounded border p-3">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{config.name}</span>
              </div>
              <Badge variant="secondary">Available</Badge>
            </div>
          )
        })}

        {availableProviders.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No social login providers are currently configured.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
