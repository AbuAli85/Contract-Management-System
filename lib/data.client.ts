import type { Database } from '@/types/supabase'
import { supabase } from '@/lib/supabase'

export async function getContractsData() {
  const { data, error } = await supabase.from('contracts').select('*')
  if (error) {
    return { success: false, message: error.message, data: null }
  }
  return { success: true, data }
}