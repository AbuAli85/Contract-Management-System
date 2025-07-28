'use client'

import { Button } from '@/src/components/ui/button'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Github, Chrome } from 'lucide-react'

export function OAuthButtons() {
  const { signInWithProvider } = useAuth()

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        onClick={() => signInWithProvider('github')}
        className="w-full"
      >
        <Github className="mr-2 h-4 w-4" />
        GitHub
      </Button>
      <Button
        variant="outline"
        onClick={() => signInWithProvider('google')}
        className="w-full"
      >
        <Chrome className="mr-2 h-4 w-4" />
        Google
      </Button>
    </div>
  )
}
