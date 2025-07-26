// DISABLED: This hook was causing infinite loops and infinite page reloads
// import { useEffect, useState } from 'react'
// import { useAuth } from '@/src/components/auth/auth-provider'

export function useRoleLoader() {
  // This hook is disabled to prevent infinite loops
  return {
    isLoading: false,
    error: null,
    loadRoleFromAPI: async () => {
      console.warn('useRoleLoader is disabled to prevent infinite loops')
    }
  }
} 