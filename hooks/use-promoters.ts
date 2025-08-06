import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"
import {
  getSupabaseClient,
  createRealtimeChannel,
  subscribeToChannel,
  handleRealtimeError,
} from "@/lib/supabase"
import { devLog } from "@/lib/dev-log"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-service"
import { useFormContext } from "@/hooks/use-form-context"
import type { Promoter } from "@/lib/types"
import type { RealtimeChannel } from "@supabase/supabase-js"

const fetchPromoters = async (): Promise<Promoter[]> => {
  const supabaseClient = getSupabaseClient()
  const { data, error } = await supabaseClient
    .from("promoters")
    .select("*")
    .order("name_en", { ascending: true })

  if (error) {
    devLog("Error fetching promoters:", error)
    // Log the complete error object for easier debugging
    devLog(error)
    throw new Error(error.message)
  }
  return data || []
}

export const usePromoters = (enableRealtime: boolean = true) => {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ["promoters"], [])
  const { toast } = useToast()
  
  // Safe auth hook usage with fallback
  let user = null
  let isFormActive = false
  
  try {
    const authResult = useAuth()
    user = authResult?.user || null
    
    const formContext = useFormContext()
    isFormActive = formContext?.isFormActive || false
  } catch (error) {
    console.warn('Auth or form context not available:', error)
    // Continue without auth - hooks will work in limited mode
  }
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const queryResult = useQuery<Promoter[], Error>({
    queryKey,
    queryFn: fetchPromoters,
    staleTime: 1000 * 60 * 5,
    retry: 3, // Retry 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: user !== null, // Only run query when we know auth status
    onError: (error) => {
      console.error("Error fetching promoters:", error)
      toast({
        title: "Error loading promoters",
        description: error.message || "Failed to load promoters. Please try again.",
        variant: "destructive",
      })
    },
  })

  // --- Realtime subscription ---
  useEffect(() => {
    if (!enableRealtime || user === null) {
      return
    }

    // Don't set up realtime if user is not authenticated
    if (!user) {
      devLog("User not authenticated, skipping realtime subscription for promoters")
      return
    }

    // Don't set up realtime if forms are active (prevents interruptions)
    if (isFormActive) {
      devLog("Forms are active, skipping realtime subscription for promoters")
      return
    }

    let retryCount = 0
    const maxRetries = 3
    let isSubscribed = false

    const setupSubscription = () => {
      if (isSubscribed) return

      try {
        // Clean up any existing channel first
        if (channelRef.current) {
          const supabaseClient = getSupabaseClient()
          supabaseClient.removeChannel(channelRef.current)
          channelRef.current = null
        }

        // Create channel using utility function
        channelRef.current = createRealtimeChannel("promoters", (payload) => {
          devLog("Realtime promoter change received!", payload)
          queryClient.invalidateQueries({ queryKey: queryKey })
        })

        if (!channelRef.current) {
          devLog("Failed to create promoters channel")
          return
        }

        // Subscribe using utility function
        subscribeToChannel(channelRef.current, (status, err) => {
          if (status === "SUBSCRIBED") {
            devLog("Subscribed to promoters channel!")
            retryCount = 0 // Reset retry count on successful connection
            isSubscribed = true
          }
          if (status === "CHANNEL_ERROR") {
            const errorType = handleRealtimeError(err, "promoters")
            devLog(
              `Promoters channel error (${status}): ${err?.message ?? "Unknown error"} - Type: ${errorType}`,
            )

            // Check if it's an authentication error
            if (errorType === "AUTH_ERROR") {
              devLog("Authentication error detected, will retry after auth check")
              // Don't retry immediately, let the auth state change handler deal with it
              return
            }

            // Retry connection if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              retryCount++
              devLog(`Retrying promoters subscription (${retryCount}/${maxRetries})...`)
              retryTimeoutRef.current = setTimeout(() => {
                isSubscribed = false
                setupSubscription()
              }, 2000 * retryCount) // Exponential backoff
            } else {
              devLog("Max retries exceeded for promoters subscription")
              // Don't show toast for realtime errors as they're not critical
            }
          }
          if (status === "TIMED_OUT") {
            devLog(`Subscription timed out (${status})`)

            // Retry connection if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              retryCount++
              devLog(
                `Retrying promoters subscription after timeout (${retryCount}/${maxRetries})...`,
              )
              retryTimeoutRef.current = setTimeout(() => {
                isSubscribed = false
                setupSubscription()
              }, 2000 * retryCount) // Exponential backoff
            } else {
              devLog("Max retries exceeded for promoters subscription after timeout")
              // Don't show toast for realtime errors as they're not critical
            }
          }
        })

        return channelRef.current
      } catch (error) {
        devLog("Error setting up promoters subscription:", error)
        return null
      }
    }

    setupSubscription()

    return () => {
      // Clean up timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      // Clean up channel
      isSubscribed = false
      if (channelRef.current) {
        const supabaseClient = getSupabaseClient()
        supabaseClient.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, enableRealtime, isFormActive, queryClient, queryKey, toast])

  return queryResult
}
