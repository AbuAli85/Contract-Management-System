import type { Database } from '@/types/supabase';
import { createClient } from '@/lib/supabase/client';

export async function getContractsData() {
  const supabaseClient = createClient();
  const { data, error } = await supabaseClient.from('contracts').select('*');
  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, data };
}
