'use client'

import { createContext, useEffect, useState, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: Session['user'] | null
  role: string | null
  loading: boolean
  signIn: (email: string, password: string, options?: { mfaCode?: string }) => Promise<void>
  signInWithProvider: (provider: 'github' | 'google' | 'twitter') => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  enrollMFA: () => Promise<{ secret: string; qr_code: string; uri: string }>
  verifyMFA: (challengeId: string, code: string, factorId: string) => Promise<void>
  unenrollMFA: (factorId: string) => Promise<void>
  forceRefreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signInWithProvider: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  enrollMFA: async () => ({ secret: '', qr_code: '', uri: '' }),
  verifyMFA: async () => {},
  unenrollMFA: async () => {},
  forceRefreshRole: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<Session['user'] | null>(null)
  const [roleLoaded, setRoleLoaded] = useState(false)

  // Load user role from database with retry mechanism
  const loadUserRole = async (userId: string, retryCount = 0): Promise<string | null> => {
    if (!userId) return null

    try {
      console.log(`🔄 Loading user role for: ${userId} (attempt ${retryCount + 1})`)
      
      const supabase = createClient()
      
      // Try to load from users table first
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (!usersError && usersData?.role) {
        console.log('✅ Role loaded from users table:', usersData.role)
        // Cache the role immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_role_${userId}`, usersData.role)
          console.log('📦 Role cached in auth provider:', usersData.role)
        }
        return usersData.role
      }

      // Try profiles table as fallback
      console.log('🔄 Users table failed, trying profiles table...')
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (!profilesError && profilesData?.role) {
        console.log('✅ Role loaded from profiles table:', profilesData.role)
        // Cache the role immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_role_${userId}`, profilesData.role)
          console.log('📦 Role cached in auth provider:', profilesData.role)
        }
        return profilesData.role
      }

      // Try app_users table as fallback
      console.log('🔄 Profiles table failed, trying app_users table...')
      const { data: appUsersData, error: appUsersError } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single()

      if (!appUsersError && appUsersData?.role) {
        console.log('✅ Role loaded from app_users table:', appUsersData.role)
        // Cache the role immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem(`user_role_${userId}`, appUsersData.role)
          console.log('📦 Role cached in auth provider:', appUsersData.role)
        }
        return appUsersData.role
      }

      // If no role found, create user record with admin role
      console.log('⚠️ No role found in any table, creating user record...')
      try {
        const { data: createData, error: createError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: user?.email || '',
            role: 'admin',
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single()

        if (!createError && createData) {
          console.log('✅ User record created with admin role:', createData.role)
          // Cache the admin role immediately
          if (typeof window !== 'undefined') {
            localStorage.setItem(`user_role_${userId}`, 'admin')
            console.log('📦 Admin role cached in auth provider')
          }
          return createData.role
        } else {
          console.log('❌ Failed to create user record:', createError)
        }
      } catch (createError) {
        console.log('❌ Error creating user record:', createError)
      }

      // If still no role and we haven't retried too many times, retry
      if (retryCount < 2) {
        console.log(`🔄 Retrying role loading (attempt ${retryCount + 2})...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        return loadUserRole(userId, retryCount + 1)
      }

      // Final fallback to admin
      console.log('⚠️ All attempts failed, defaulting to admin')
      // Cache the admin role immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(`user_role_${userId}`, 'admin')
        console.log('📦 Admin role cached in auth provider (final fallback)')
      }
      return 'admin'
      
    } catch (error) {
      console.log('❌ Error loading user role:', error)
      
      // Retry on error if we haven't retried too many times
      if (retryCount < 2) {
        console.log(`🔄 Retrying after error (attempt ${retryCount + 2})...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        return loadUserRole(userId, retryCount + 1)
      }
      
      // Cache the admin role on error
      if (typeof window !== 'undefined') {
        localStorage.setItem(`user_role_${userId}`, 'admin')
        console.log('📦 Admin role cached in auth provider (error fallback)')
      }
      return 'admin'
    }
  }

  // Synchronous role loading that waits for completion
  const loadRoleSynchronously = async (userId: string) => {
    console.log('🔄 Starting synchronous role loading for:', userId)
    setLoading(true)
    
    const userRole = await loadUserRole(userId)
    
    console.log('✅ Synchronous role loading complete:', userRole)
    setRole(userRole)
    setRoleLoaded(true)
    setLoading(false)
    
    return userRole
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const supabase = createClient()
        
        // Check active sessions first
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        console.log("🔍 Auth initialization - Session check:", {
          hasSession: !!initialSession,
          sessionError: sessionError?.message,
          userId: initialSession?.user?.id,
          userEmail: initialSession?.user?.email
        })

        if (sessionError) {
          console.error("❌ Session error:", sessionError)
        }

        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          
          // Load role synchronously if user exists
          if (initialSession?.user?.id) {
            console.log("🔄 Loading role synchronously for existing session...")
            await loadRoleSynchronously(initialSession.user.id)
          } else {
            setLoading(false)
            setRoleLoaded(true)
          }
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("🔄 Auth state change:", {
            event,
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
          })
          
          if (mounted) {
            setSession(session)
            setUser(session?.user ?? null)
            
            // Load role synchronously when auth state changes
            if (session?.user?.id) {
              console.log("🔄 Loading role synchronously for auth state change...")
              await loadRoleSynchronously(session.user.id)
            } else {
              setRole(null)
              setRoleLoaded(true)
              setLoading(false)
            }
          }
        })

        return () => {
          mounted = false
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error)
        if (mounted) {
          setLoading(false)
          setRoleLoaded(true)
        }
      }
    }

    initializeAuth()
  }, [])

  // Ensure role is loaded whenever user changes
  useEffect(() => {
    if (user?.id && !roleLoaded) {
      console.log("🔄 User changed, loading role synchronously for:", user.id)
      loadRoleSynchronously(user.id)
    } else if (!user) {
      setRole(null)
      setRoleLoaded(true)
    }
  }, [user?.id, roleLoaded])

  const value = {
    session,
    user,
    role,
    loading,
    signIn: async (email: string, password: string, options?: { mfaCode?: string }) => {
      console.log("🔐 Attempting sign in for:", email)
      const { error } = await createClient().auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: undefined,
          ...options
        }
      })
      if (error) {
        console.error("❌ Sign in error:", error)
        throw error
      }
      console.log("✅ Sign in successful")
    },
    signInWithProvider: async (provider: 'github' | 'google' | 'twitter') => {
      console.log("🔐 Attempting OAuth sign in with:", provider)
      const { error } = await createClient().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        console.error("❌ OAuth sign in error:", error)
        throw error
      }
    },
    signUp: async (email: string, password: string) => {
      console.log("📝 Attempting sign up for:", email)
      const { error } = await createClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        console.error("❌ Sign up error:", error)
        throw error
      }
      console.log("✅ Sign up successful")
    },
    signOut: async () => {
      console.log("🚪 Attempting sign out")
      const { error } = await createClient().auth.signOut()
      if (error) {
        console.error("❌ Sign out error:", error)
        throw error
      }
      console.log("✅ Sign out successful")
    },
    resetPassword: async (email: string) => {
      console.log("🔑 Attempting password reset for:", email)
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) {
        console.error("❌ Password reset error:", error)
        throw error
      }
      console.log("✅ Password reset email sent")
    },
    updatePassword: async (newPassword: string) => {
      console.log("🔑 Attempting password update")
      const { error } = await createClient().auth.updateUser({
        password: newPassword
      })
      if (error) {
        console.error("❌ Password update error:", error)
        throw error
      }
      console.log("✅ Password updated successfully")
    },
    enrollMFA: async () => {
      console.log("🔐 Attempting MFA enrollment")
      const { data, error } = await createClient().auth.mfa.enroll({
        factorType: 'totp'
      })
      if (error) {
        console.error("❌ MFA enrollment error:", error)
        throw error
      }
      console.log("✅ MFA enrollment successful")
      return {
        secret: data.totp.secret,
        qr_code: data.totp.qr_code,
        uri: data.totp.uri
      }
    },
    verifyMFA: async (challengeId: string, code: string, factorId: string) => {
      console.log("🔐 Attempting MFA verification")
      const { error } = await createClient().auth.mfa.verify({
        factorId,
        challengeId,
        code
      })
      if (error) {
        console.error("❌ MFA verification error:", error)
        throw error
      }
      console.log("✅ MFA verification successful")
    },
    unenrollMFA: async (factorId: string) => {
      console.log("🔐 Attempting MFA unenrollment")
      const { error } = await createClient().auth.mfa.unenroll({
        factorId
      })
      if (error) {
        console.error("❌ MFA unenrollment error:", error)
        throw error
      }
      console.log("✅ MFA unenrollment successful")
    },
    forceRefreshRole: async () => {
      console.log("🔄 Forcing role refresh")
      if (user?.id) {
        await loadRoleSynchronously(user.id)
      } else {
        setRole(null)
      }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
