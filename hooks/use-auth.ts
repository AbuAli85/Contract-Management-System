import { useState, useEffect } from "react"
import { devLog } from "@/lib/dev-log"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkAuth = async () => {
      try {
        const supabaseClient = getSupabaseClient()
        const { data: { session } } = await supabaseClient.auth.getSession()
        setUser(session?.user ?? null)
        setIsAuthenticated(!!session?.user)
      } catch (error) {
        devLog("Error checking authentication status:", error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()

    const setupAuthListener = async () => {
      try {
        const supabaseClient = getSupabaseClient()
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null)
          setIsAuthenticated(!!session?.user)
          setLoading(false)
        })
        return () => subscription.unsubscribe()
      } catch (error) {
        devLog("Error setting up auth listener:", error)
        return () => {}
      }
    }

    setupAuthListener()
  }, [])

  return {
    user,
    isAuthenticated: mounted ? isAuthenticated : null,
    loading: mounted ? loading : true,
  }
}
