import { createClient } from '@/lib/supabase/server'

export async function checkOrganizationAccess(resource: string, args: any): Promise<boolean> {
  const { user, params, body, query } = args
  if (!user?.id) return false
  const organizationId = query?.organization_id || body?.organization_id || params?.organization_id
  if (!organizationId) return false

  // Organization modeled as company in this repository
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('user_roles')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('company_id', organizationId)
    .eq('is_active', true)
    .maybeSingle()
  return !!membership
}



