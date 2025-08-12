import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createClient(url, key, { 
      auth: { 
        persistSession: true, 
        autoRefreshToken: true 
      } 
    });
  }
  
  return supabaseInstance;
}

// Export a function that can be called when needed
export const supabase = () => getSupabaseClient(); 