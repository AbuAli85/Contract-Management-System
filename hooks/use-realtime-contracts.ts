import { useState, useCallback, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRealtimeTable } from "./use-realtime-table"
import type { Contract } from "@/lib/types"

export function useRealtimeContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])

  const fetchContracts = useCallback(async () => {
    const supabaseClient = getSupabaseClient()
    const { data } = await supabaseClient.from("contracts").select("*").order("created_at", { ascending: false })
    setContracts(Array.isArray(data) ? (data as Contract[]) : [])
  }, [])

  useRealtimeTable("contracts", fetchContracts)

  // Initial fetch
  useEffect(() => { fetchContracts() }, [fetchContracts])

  return contracts
}
