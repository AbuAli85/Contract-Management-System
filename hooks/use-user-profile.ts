import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-service'
import { getRoleDisplay as getHierarchyRoleDisplay } from '@/lib/role-hierarchy'
import type { UserProfile } from '@/types/custom'

export interface EnhancedUserProfile extends UserProfile {
  display_name: string
  initials: string
  role_display: string
  last_activity?: string
  total_activities?: number
}

export function useUserProfile() {
  console.log('🔄 useUserProfile hook loaded - v2.0.1 - Production fix')
  const { user } = useAuth()
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getDisplayName = (userProfile: UserProfile | null, authUser: any) => {
    if (userProfile?.full_name) {
      return userProfile.full_name
    }
    if (authUser?.user_metadata?.full_name) {
      return authUser.user_metadata.full_name
    }
    return authUser?.email || "User"
  }

  const getRoleDisplay = (role: string | null | undefined) => {
    if (!role) return "User"
    const hierarchyDisplay = getHierarchyRoleDisplay(role)
    return hierarchyDisplay.displayText
  }

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the target user ID
      let targetUserId = user?.id
      
      // Only use fallback in localhost development environment
      const isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.local')
      )
      
      // Debug logging
      console.log('🔍 Environment check:', {
        user: user?.id ? 'authenticated' : 'not authenticated',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
        isLocalhost,
        targetUserId,
        NODE_ENV: process.env.NODE_ENV,
        currentURL: typeof window !== 'undefined' ? window.location.href : 'server'
      })
      
      if (!targetUserId) {
        console.error('🚨 BLOCKING API CALL - No user ID available!', {
          user: user?.id,
          isLocalhost,
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
        })
        
        if (isLocalhost) {
          console.log('⚠️ No authenticated user, using default admin user for localhost development')
          targetUserId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170' // Default admin user (Fahad alamri)
        } else {
          // In production/deployed environment, require authentication
          console.error('❌ No authenticated user found in production environment')
          setLoading(false)
          setError('Please log in to continue')
          return
        }
      }

      console.log('🔍 Fetching profile for user:', targetUserId)

      // SAFETY CHECK: Never allow hardcoded user ID in production
      const isProductionHardcodedId = targetUserId === '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170' && !isLocalhost
      if (isProductionHardcodedId) {
        console.error('🚨 BLOCKED: Attempted to use hardcoded user ID in production!', {
          targetUserId,
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
          isLocalhost
        })
        setLoading(false)
        setError('Authentication required for production environment')
        return
      }

      const response = await fetch("/api/users/profile/" + targetUserId, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Profile fetch failed:', response.status, errorText)
        
        // In production, provide more user-friendly error messages
        if (response.status === 404) {
          throw new Error('User profile not found. Please contact support.')
        } else if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You may not have permission to view this profile.')
        } else {
          throw new Error(`Profile fetch failed. Please try again later. (Error: ${response.status})`)
        }
      }

      const userProfile: UserProfile = await response.json()
      console.log('✅ Profile fetched successfully:', userProfile)
      
      const enhancedProfile: EnhancedUserProfile = {
        ...userProfile,
        display_name: getDisplayName(userProfile, user || { id: targetUserId, email: userProfile.email }),
        initials: getInitials(getDisplayName(userProfile, user || { id: targetUserId, email: userProfile.email })),
        role_display: getRoleDisplay(userProfile.role),
        last_activity: userProfile.last_login || undefined,
        total_activities: 0 // Will be updated by activity hook if needed
      }

      setProfile(enhancedProfile)
    } catch (err) {
      console.error('❌ Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      
      // Fallback to basic profile from auth (only if user is authenticated)
      if (user && user.id) {
        console.log('🔄 Using fallback profile from authentication data')
        const fallbackProfile: EnhancedUserProfile = {
          id: user.id,
          email: user.email || '',
          display_name: getDisplayName(null, user),
          initials: getInitials(getDisplayName(null, user)),
          role_display: getRoleDisplay(user.user_metadata?.role),
          avatar_url: user.user_metadata?.avatar_url || null,
          full_name: user.user_metadata?.full_name || null,
          role: user.user_metadata?.role || null,
          created_at: user.created_at || null,
          last_login: user.last_sign_in_at || null
        }
        setProfile(fallbackProfile)
      } else {
        // No user data available, profile remains null
        setProfile(null)
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user?.id) {
        throw new Error('No user ID available')
      }

      const response = await fetch("/api/users/profile/" + user.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update user profile')
      }

      const updatedProfile: UserProfile = await response.json()
      
      const enhancedProfile: EnhancedUserProfile = {
        ...updatedProfile,
        display_name: getDisplayName(updatedProfile, user),
        initials: getInitials(getDisplayName(updatedProfile, user)),
        role_display: getRoleDisplay(updatedProfile.role),
        last_activity: updatedProfile.last_login || undefined,
        total_activities: profile?.total_activities || 0
      }

      setProfile(enhancedProfile)
      return enhancedProfile
    } catch (err) {
      console.error('Error updating user profile:', err)
      throw err
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile()
    } else {
      // No user authenticated - reset profile state
      setProfile(null)
      setLoading(false)
      setError(null)
    }
  }, [user?.id, fetchUserProfile])

  return {
    profile,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile,
    getDisplayName: (userProfile?: UserProfile | null) => getDisplayName(userProfile || null, user),
    getInitials: (fullName?: string) => getInitials(fullName || getDisplayName(null, user)),
    getRoleDisplay: (role?: string | null) => getRoleDisplay(role)
  }
} 