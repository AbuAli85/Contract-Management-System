// 🚨 EMERGENCY CIRCUIT BREAKER MODE 🚨
// This auth service is completely disabled to prevent infinite loops

export function useAuth() {
  console.log("🚨 EMERGENCY MODE: useAuth using circuit breaker - NO NETWORK CALLS")
  
  return {
    user: null,
    session: null,
    loading: false,
    signIn: () => {
      console.log("🚨 EMERGENCY MODE: signIn disabled")
      return Promise.resolve({ user: null, session: null })
    },
    signOut: () => {
      console.log("🚨 EMERGENCY MODE: signOut disabled")
      return Promise.resolve()
    },
    signUp: () => {
      console.log("🚨 EMERGENCY MODE: signUp disabled")
      return Promise.resolve({ user: null, session: null })
    }
  }
}

export const authService = {
  signIn: () => {
    console.log("🚨 EMERGENCY MODE: authService.signIn disabled")
    return Promise.resolve({ user: null, session: null })
  },
  signOut: () => {
    console.log("🚨 EMERGENCY MODE: authService.signOut disabled")
    return Promise.resolve()
  },
  signUp: () => {
    console.log("🚨 EMERGENCY MODE: authService.signUp disabled")
    return Promise.resolve({ user: null, session: null })
  },
  getCurrentUser: () => {
    console.log("🚨 EMERGENCY MODE: authService.getCurrentUser disabled")
    return Promise.resolve(null)
  },
  getSession: () => {
    console.log("🚨 EMERGENCY MODE: authService.getSession disabled")
    return Promise.resolve(null)
  }
}
