import { supabase } from './client'
import type { Toast } from '@/hooks/use-toast'

export async function signIn(
  email: string, 
  password: string, 
  toast: (props: Toast) => void
) {
  try {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    if (error) throw error
  } catch (error: unknown) {
    console.error('Sign in error:', error)
    toast({ 
      title: 'Error', 
      description: (error as Error).message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function signUp(
  email: string, 
  password: string, 
  metadata?: Record<string, any>,
  toast?: (props: Toast) => void
) {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata ?? {},
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  } catch (error: unknown) {
    console.error('Sign up error:', error)
    toast?.({ 
      title: 'Error', 
      description: (error as Error).message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function signOut(toast?: (props: Toast) => void) {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error: unknown) {
    console.error('Sign out error:', error)
    toast?.({ 
      title: 'Error', 
      description: (error as Error).message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function resetPassword(
  email: string, 
  redirectTo?: string,
  toast?: (props: Toast) => void
) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
  } catch (error: unknown) {
    console.error('Password reset error:', error)
    toast?.({ 
      title: 'Error', 
      description: (error as Error).message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function updatePassword(
  newPassword: string,
  toast?: (props: Toast) => void
) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  } catch (error: unknown) {
    console.error('Password update error:', error)
    toast?.({ 
      title: 'Error', 
      description: (error as Error).message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function signInWithOAuth(
  provider: 'google' | 'github',
  redirectTo?: string,
  toast?: (props: Toast) => void
) {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  } catch (error: unknown) {
    console.error('OAuth sign in error:', error)
    toast?.({ 
      title: 'Error', 
      description: (error as Error).message,
      variant: 'destructive'
    })
    throw error
  }
}
