import type { Database } from "@/types/supabase"
import { getSupabaseClient } from "@/lib/supabase"

export async function getContractsData() {
  const supabaseClient = getSupabaseClient()
  const { data, error } = await supabaseClient.from("contracts").select("*")
  if (error) {
    return { success: false, message: error.message, data: null }
  }
  return { success: true, data }
}
