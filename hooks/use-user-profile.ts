import { useState, useEffect } from 'react'
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

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('No user ID available')
      }

      const response = await fetch("/api/users/profile/" + user.id, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const userProfile: UserProfile = await response.json()
      
      const enhancedProfile: EnhancedUserProfile = {
        ...userProfile,
        display_name: getDisplayName(userProfile, user),
        initials: getInitials(getDisplayName(userProfile, user)),
        role_display: getRoleDisplay(userProfile.role),
        last_activity: userProfile.last_login || undefined,
        total_activities: 0 // Will be updated by activity hook if needed
      }

      setProfile(enhancedProfile)
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to basic profile from auth
      if (user) {
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
      }
    } finally {
      setLoading(false)
    }
  }

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
    }
  }, [user?.id])

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