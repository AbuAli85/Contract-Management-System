import { useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/src/components/auth/auth-provider"
import { devLog } from "@/lib/dev-log"
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeTable(table: string, onChange: (payload: any) => void) {
  const { user } = useAuth()

  useEffect(() => {
    // Don't set up realtime if user is not authenticated
    if (!user) {
      return
    }

    let channel: RealtimeChannel | null = null

    try {
      const supabaseClient = getSupabaseClient()
      channel = supabaseClient
        .channel(`public:${table}:realtime`)
        .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR") {
            const message = err?.message ?? "Unknown channel error"
            devLog(`${table} channel error (${status}): ${message}`)
            
            // Check if it's an authentication error
            if (message.includes("JWT") || message.includes("auth") || message.includes("permission")) {
              devLog(`Authentication error detected for ${table}, will retry after auth check`)
              return
            }
          }
        })
    } catch (error) {
      devLog(`Error setting up ${table} subscription:`, error)
    }

    return () => {
      if (channel) {
        const supabaseClient = getSupabaseClient()
        supabaseClient.removeChannel(channel as RealtimeChannel)
      }
    }
  }, [table, onChange, user])
}
