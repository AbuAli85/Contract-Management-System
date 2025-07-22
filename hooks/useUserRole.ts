import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Lazy import to avoid build-time issues
let supabase: SupabaseClient<Database> | null = null

async function getSupabase(): Promise<SupabaseClient<Database>> {
  if (!supabase) {
    const { supabase: supabaseClient } = await import('../lib/supabase')
    supabase = supabaseClient
  }
  return supabase
}

export function useUserRole() {
  const [user, setUser] = useState<unknown>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      try {
        const supabaseClient = await getSupabase()
        const { data: { user } } = await supabaseClient.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      }
    }
    getUser()

    // Listen for auth changes
    const setupAuthListener = async () => {
      try {
        const supabaseClient = await getSupabase()
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event: string, session: { user: unknown } | null) => {
          setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error setting up auth listener:', error)
        return () => {}
      }
    }

    setupAuthListener()
  }, [])

  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        try {
          const supabaseClient = await getSupabase()
          const { data } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', (user && typeof user === 'object' && user !== null && 'id' in user && typeof (user as { id: string }).id === 'string') ? (user as { id: string }).id : '')
            .single()
          setRole(data?.role ?? null)
        } catch (error) {
          console.error('Error fetching role:', error)
        }
      }
      fetchRole()
    }
  }, [user])

  return role
} 