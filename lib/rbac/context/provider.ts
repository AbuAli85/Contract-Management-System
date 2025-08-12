import { createClient } from '@/lib/supabase/server'

export async function checkProviderAccess(resource: string, args: any): Promise<boolean> {
  const { user, params, body, query } = args
  if (!user?.id) return false
  const supabase = await createClient()

  let companyId: string | null = null
  switch (resource) {
    case 'service': {
      const serviceId = params?.id || body?.service_id || query?.service_id
      if (!serviceId) return false
      const { data } = await supabase.from('services').select('company_id').eq('id', serviceId).single()
      companyId = data?.company_id ?? null
      break
    }
    case 'booking': {
      const bookingId = params?.id || body?.booking_id || query?.booking_id
      if (!bookingId) return false
      const { data } = await supabase.from('bookings').select('provider_company_id').eq('id', bookingId).single()
      companyId = data?.provider_company_id ?? null
      break
    }
    default:
      companyId = query?.company_id || body?.company_id || params?.company_id || null
  }

  if (!companyId) return false
  const { data: membership } = await supabase
    .from('user_roles')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .maybeSingle()
  return !!membership
}


