'use client'

import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Button } from '@/components/ui/button'
import { Github, Chrome } from 'lucide-react'

export function OAuthButtons() {
  const { signInWithProvider } = useAuth()

  const handleOAuthSignIn = async (provider: 'github' | 'google' | 'twitter') => {
    try {
      const { error } = await signInWithProvider(provider)
      if (error) {
        console.error(`OAuth sign in error (${provider}):`, error)
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error(`OAuth sign in error (${provider}):`, error)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn('github')}
      >
        <Github className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn('google')}
      >
        <Chrome className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </div>
  )
} 