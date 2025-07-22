import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Lazy import to avoid build-time issues
let supabaseInstance: SupabaseClient<Database> | null = null

export async function getSupabaseClient(): Promise<SupabaseClient<Database>> {
  if (!supabaseInstance) {
    const { supabase } = await import('./supabase')
    supabaseInstance = supabase
  }
  return supabaseInstance
}

// Export a default function that can be used as a drop-in replacement
export default getSupabaseClient 