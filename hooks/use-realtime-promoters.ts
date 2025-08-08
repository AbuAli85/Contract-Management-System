import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRealtimeTable } from "./use-realtime-table"
import type { Promoter } from "@/lib/types"

export function useRealtimePromoters() {
  const [promoters, setPromoters] = useState<Promoter[]>([])

  const fetchPromoters = useCallback(async () => {
    const supabaseClient = createClient()
    const { data } = await supabaseClient.from("promoters").select("*")
    setPromoters(Array.isArray(data) ? (data as Promoter[]) : [])
  }, [])

  useRealtimeTable("promoters", fetchPromoters)

  useEffect(() => {
    fetchPromoters()
  }, [fetchPromoters])

  return promoters
}
