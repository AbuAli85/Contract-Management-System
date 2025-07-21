import { supabase } from './client'
import type { ToastAPI } from '@/hooks/use-toast'

export async function signIn(
  email: string, 
  password: string, 
  toast: ToastAPI
) {
  try {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    if (error) throw error
  } catch (error: any) {
    console.error('Sign in error:', error)
    toast({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function signUp(
  email: string, 
  password: string, 
  metadata?: any,
  toast?: ToastAPI
) {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  } catch (error: any) {
    console.error('Sign up error:', error)
    toast?.({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function signOut(toast?: ToastAPI) {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error: any) {
    console.error('Sign out error:', error)
    toast?.({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function resetPassword(
  email: string, 
  redirectTo?: string,
  toast?: ToastAPI
) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
  } catch (error: any) {
    console.error('Password reset error:', error)
    toast?.({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function updatePassword(
  newPassword: string,
  toast?: ToastAPI
) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  } catch (error: any) {
    console.error('Password update error:', error)
    toast?.({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive'
    })
    throw error
  }
}

export async function signInWithOAuth(
  provider: 'google' | 'github',
  redirectTo?: string,
  toast?: ToastAPI
) {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  } catch (error: any) {
    console.error('OAuth sign in error:', error)
    toast?.({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive'
    })
    throw error
  }
}
