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
          
          // First, try to ensure the user profile exists
          try {
            await supabaseClient.rpc('ensure_user_profile', { 
              user_id: user && typeof user === "object" && user !== null && "id" in user 
                ? (user as { id: string }).id 
                : "" 
            })
          } catch (error) {
            console.log("Could not ensure user profile:", error)
          }
          
          // Now try to fetch the role
          const { data, error } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq(
              "id",
              user &&
                typeof user === "object" &&
                user !== null &&
                "id" in user &&
                typeof (user as { id: string }).id === "string"
                ? (user as { id: string }).id
                : "",
            )
            .single()
          
          if (error) {
            console.error("Error fetching role from profiles:", error)
            // Try alternative approach - use the API route instead
            try {
              const response = await fetch('/api/get-user-role', {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
              })
              if (response.ok) {
                const roleData = await response.json()
                setRole(roleData.role?.value ?? roleData.role ?? null)
              } else {
                console.error("API route also failed:", response.status)
                // Fallback to default role based on email
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
            } catch (apiError) {
              console.error("API route error:", apiError)
              // Fallback to default role based on email
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
          } else {
            setRole(data?.role ?? null)
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
