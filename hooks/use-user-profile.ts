import { useState, useEffect, useCallback } from "react"

// 🚨 EMERGENCY CIRCUIT BREAKER MODE 🚨
// This hook is completely disabled to prevent infinite loops

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

// Emergency safe fallback profile
const EMERGENCY_SAFE_PROFILE: EnhancedUserProfile = {
  id: 'emergency-user',
  email: 'emergency@example.com',
  full_name: 'Emergency User',
  display_name: 'Emergency User',
  role: 'user',
  status: 'active',
  getDisplayName: () => 'Emergency User',
  getInitials: () => 'EU',
  getRoleDisplay: () => 'User'
}

export function useUserProfile() {
  console.log("🚨 EMERGENCY MODE: useUserProfile using circuit breaker - NO NETWORK CALLS")
  
  return {
    profile: EMERGENCY_SAFE_PROFILE,
    loading: false,
    error: null,
    fetchUserProfile: () => {
      console.log("🚨 EMERGENCY MODE: fetchUserProfile disabled")
      return Promise.resolve()
    },
    syncUserProfile: () => {
      console.log("🚨 EMERGENCY MODE: syncUserProfile disabled")  
      return Promise.resolve()
    },
    isProfileSynced: true
  }
}
