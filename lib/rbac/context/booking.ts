import { createClient } from '@/lib/supabase/server'

export async function checkBookingAccess(resource: string, args: any): Promise<boolean> {
  const { user, params, body, query } = args
  if (!user?.id) return false
  const bookingId = params?.id || body?.booking_id || query?.booking_id
  if (!bookingId) return false

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('client_id, provider_company_id')
    .eq('id', bookingId)
    .single()
  if (error || !data) return false

  if (data.client_id === user.id) return true
  const { data: membership } = await supabase
    .from('user_roles')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('company_id', data.provider_company_id)
    .eq('is_active', true)
    .maybeSingle()
  return !!membership
}



