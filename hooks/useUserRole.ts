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
          const { data } = await supabaseClient
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
          setRole(data?.role ?? null)
        } catch (error) {
          console.error("Error fetching role:", error)
        }
      }
      fetchRole()
    }
  }, [user])

  return role
}
