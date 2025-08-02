import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"

export function useUserRole() {
  const [user, setUser] = useState<unknown>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      try {
        const supabaseClient = getSupabaseClient()
        const {
          data: { user },
        } = await supabaseClient.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error getting user:", error)
      }
    }
    getUser()

    // Listen for auth changes
    const setupAuthListener = async () => {
      try {
        const supabaseClient = getSupabaseClient()
        const {
          data: { subscription },
        } = supabaseClient.auth.onAuthStateChange(
          (event: string, session: { user: unknown } | null) => {
            setUser(session?.user ?? null)
          },
        )
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Error setting up auth listener:", error)
        return () => {}
      }
    }

    setupAuthListener()
  }, [])

  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        try {
          const supabaseClient = getSupabaseClient()
          
          // First try the API route since it's more reliable
          try {
            const response = await fetch('/api/get-user-role', {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            })
            if (response.ok) {
              const roleData = await response.json()
              const fetchedRole = roleData.role?.value ?? roleData.role ?? null
              setRole(fetchedRole)
              return // Success, exit early
            } else {
              console.log("API route failed:", response.status)
            }
          } catch (apiError) {
            console.log("API route error:", apiError)
          }

          // Fallback: Try the RPC function
          try {
            const { data, error } = await supabaseClient.rpc('get_current_user_role')
            if (!error && data) {
              setRole(data)
              return // Success, exit early
            } else {
              console.log("RPC function error:", error)
            }
          } catch (rpcError) {
            console.log("RPC function failed:", rpcError)
          }

          // Final fallback: Use email-based role assignment
          if (user && typeof user === "object" && "email" in user) {
            const email = (user as { email: string }).email
            if (email === 'luxsess2001@gmail.com') {
              setRole('admin')
            } else {
              setRole('user')
            }
          } else {
            setRole('user')
          }
        } catch (error) {
          console.error("Error fetching role:", error)
          // Final fallback
          if (user && typeof user === "object" && "email" in user) {
            const email = (user as { email: string }).email
            if (email === 'luxsess2001@gmail.com') {
              setRole('admin')
            } else {
              setRole('user')
            }
          } else {
            setRole('user')
          }
        }
      }
      fetchRole()
    }
  }, [user])

  return role
}
