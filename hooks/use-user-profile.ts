import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-service"

// Emergency fix for user profile hook
interface UserProfile {
  id: string
  email: string
  full_name?: string
  display_name?: string
  role?: string
  status?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface EnhancedUserProfile extends UserProfile {
  getDisplayName: () => string
  getInitials: () => string
  getRoleDisplay: () => string
}

// Emergency circuit breaker for preventing infinite loops
const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_WINDOW = 60000 // 1 minute

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Emergency circuit breaker implementation
  const checkCircuitBreaker = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    const now = Date.now()
    const lastReset = parseInt(window.localStorage.getItem('userProfileCircuitReset') || '0')
    const callCount = parseInt(window.localStorage.getItem('userProfileCallCount') || '0')
    
    // Reset circuit breaker after time window
    if (now - lastReset > CIRCUIT_BREAKER_WINDOW) {
      window.localStorage.setItem('userProfileCircuitReset', now.toString())
      window.localStorage.setItem('userProfileCallCount', '0')
      return false
    }
    
    // Check if we've exceeded the threshold
    if (callCount >= CIRCUIT_BREAKER_THRESHOLD) {
      console.warn('🚨 User profile circuit breaker activated - too many calls')
      return true
    }
    
    return false
  }, [])

  const getInitials = (fullName: string) => {
    if (!fullName || typeof fullName !== 'string') return 'U'
    
    try {
      return fullName
        .split(" ")
        .filter(name => name && name.length > 0) // Safety filter
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || 'U'
    } catch (error) {
      console.warn('Error generating initials:', error)
      return 'U'
    }
  }

  const getDisplayName = (userProfile: UserProfile | null, authUser: any) => {
    try {
      if (userProfile?.full_name && typeof userProfile.full_name === 'string') {
        return userProfile.full_name
      }
      if (userProfile?.display_name && typeof userProfile.display_name === 'string') {
        return userProfile.display_name
      }
      if (authUser?.email && typeof authUser.email === 'string') {
        return authUser.email.split('@')[0] || 'User'
      }
      return 'User'
    } catch (error) {
      console.warn('Error getting display name:', error)
      return 'User'
    }
  }

  const getRoleDisplay = (role?: string) => {
    try {
      if (!role || typeof role !== 'string') return 'User'
      
      const roleMap: { [key: string]: string } = {
        'admin': 'Administrator',
        'user': 'User',
        'manager': 'Manager',
        'editor': 'Editor'
      }
      
      return roleMap[role.toLowerCase()] || role
    } catch (error) {
      console.warn('Error getting role display:', error)
      return 'User'
    }
  }

  const fetchUserProfile = useCallback(async () => {
    // Emergency mode checks
    if (checkCircuitBreaker()) {
      console.warn('🚨 Circuit breaker active - returning emergency profile')
      setProfile({
        id: 'emergency',
        email: 'emergency@local',
        full_name: 'Emergency User',
        role: 'user',
        status: 'active',
        getDisplayName: () => 'Emergency User',
        getInitials: () => 'EU',
        getRoleDisplay: () => 'User'
      })
      setLoading(false)
      setError(null)
      return
    }

    // Increment call counter
    if (typeof window !== 'undefined') {
      const callCount = parseInt(window.localStorage.getItem('userProfileCallCount') || '0')
      window.localStorage.setItem('userProfileCallCount', (callCount + 1).toString())
    }

    try {
      setLoading(true)
      setError(null)

      // Determine target user ID with safety checks
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      let targetUserId = user?.id

      if (!targetUserId) {
        if (isLocalhost) {
          console.log('⚠️ No authenticated user, using default admin user for localhost development')
          targetUserId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170' // Default admin user
        } else {
          console.error('❌ No authenticated user found')
          setLoading(false)
          setError('Please log in to continue')
          return
        }
      }

      console.log('🔍 Fetching profile for user:', targetUserId)

      // SAFETY CHECK: Never allow hardcoded user ID in production
      const isProductionHardcodedId = targetUserId === '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170' && !isLocalhost
      if (isProductionHardcodedId) {
        console.error('🚨 BLOCKED: Attempted to use hardcoded user ID in production!')
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
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch user profile")
      }

      // Safely create enhanced profile with defensive programming
      const baseProfile = data.profile || {}
      const enhancedProfile: EnhancedUserProfile = {
        id: baseProfile.id || targetUserId,
        email: baseProfile.email || user?.email || 'unknown@local',
        full_name: baseProfile.full_name || '',
        display_name: baseProfile.display_name || '',
        role: baseProfile.role || 'user',
        status: baseProfile.status || 'active',
        avatar_url: baseProfile.avatar_url || '',
        created_at: baseProfile.created_at || '',
        updated_at: baseProfile.updated_at || '',
        getDisplayName: () => getDisplayName(baseProfile, user),
        getInitials: () => getInitials(baseProfile.full_name || baseProfile.display_name || ''),
        getRoleDisplay: () => getRoleDisplay(baseProfile.role)
      }

      setProfile(enhancedProfile)
      setLoading(false)

    } catch (error) {
      console.error("Error fetching user profile:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      
      // Create a fallback emergency profile instead of failing completely
      const emergencyProfile: EnhancedUserProfile = {
        id: user?.id || 'unknown',
        email: user?.email || 'unknown@local',
        full_name: 'User',
        role: 'user',
        status: 'active',
        getDisplayName: () => user?.email?.split('@')[0] || 'User',
        getInitials: () => user?.email?.[0]?.toUpperCase() || 'U',
        getRoleDisplay: () => 'User'
      }

      setProfile(emergencyProfile)
      setLoading(false)
      setError(errorMessage)
    }
  }, [user, checkCircuitBreaker])

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) {
      throw new Error("No user or profile available")
    }

    try {
      const response = await fetch(`/api/users/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      const data = await response.json()
      
      if (data.success && data.profile) {
        // Update the enhanced profile safely
        const updatedProfile: EnhancedUserProfile = {
          ...profile,
          ...data.profile,
          getDisplayName: () => getDisplayName(data.profile, user),
          getInitials: () => getInitials(data.profile.full_name || data.profile.display_name || ''),
          getRoleDisplay: () => getRoleDisplay(data.profile.role)
        }
        setProfile(updatedProfile)
      }

      return data
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }, [user, profile])

  // Fetch profile on mount and when user changes
  useEffect(() => {
    if (user || typeof window !== 'undefined') {
      fetchUserProfile()
    } else {
      setLoading(false)
      setProfile(null)
    }
  }, [user?.id]) // Removed fetchUserProfile from dependencies to prevent infinite loop

  return {
    profile,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile,
    getDisplayName: () => profile?.getDisplayName() || 'User',
    getInitials: () => profile?.getInitials() || 'U',
    getRoleDisplay: () => profile?.getRoleDisplay() || 'User'
  }
}
