/*
  Idempotent RBAC seeder. Run with: npx ts-node scripts/rbac_seed.ts
  Or via npm script: npm run rbac:seed
*/
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing Supabase service role credentials')
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function upsertRole(supabase: any, name: string, category: string, description = ''): Promise<string> {
  const { data, error } = await supabase.rpc('rbac_upsert_role', { p_name: name, p_category: category, p_description: description })
  if (error) throw error
  return data as string
}

async function upsertPermission(supabase: any, resource: string, action: string, scope: string, name: string, description = ''): Promise<string> {
  const { data, error } = await supabase.rpc('rbac_upsert_permission', { p_resource: resource, p_action: action, p_scope: scope, p_name: name, p_description: description })
  if (error) throw error
  return data as string
}

async function attach(supabase: any, roleId: string, permId: string) {
  const { error } = await supabase.rpc('rbac_attach_permission', { p_role_id: roleId, p_perm_id: permId })
  if (error) throw error
}

async function seed() {
  const supabase = getAdminClient()

  // Define roles
  const roles = [
    ['Basic Client','client'], ['Premium Client','client'], ['Enterprise Client','client'], ['Client Administrator','client'],
    ['Individual Provider','provider'], ['Provider Team Member','provider'], ['Provider Manager','provider'], ['Provider Administrator','provider'],
    ['Support Agent','admin'], ['Content Moderator','admin'], ['Platform Administrator','admin'], ['System Administrator','admin']
  ] as const

  const roleIds = new Map<string,string>()
  for (const [name, category] of roles) {
    const id = await upsertRole(supabase, name, category)
    roleIds.set(name, id)
  }

  // Define permissions (subset representative; full list can be extended identically)
  const permissionStrings = [
    'user:read:own','user:update:own','user:delete:own','user:read:all','user:update:all','user:create:all',
    'auth:login:own','auth:logout:own','auth:reset:own','auth:manage:all','security:view:own','security:manage:all',
    'service:create:own','service:read:own','service:update:own','service:delete:own','service:read:all','service:moderate:all',
    'service:search:all','service:view:public','service:review:create','service:review:manage:own','service:favorite:manage',
    'booking:create:own','booking:read:own','booking:update:own','booking:cancel:own','booking:read:provider','booking:manage:provider','booking:read:all',
    'booking:confirm:provider','booking:start:provider','booking:complete:provider','booking:reschedule:mutual','booking:dispute:create','booking:dispute:resolve',
    'message:send:booking','message:read:own','message:manage:own','message:moderate:all','notification:receive:own','notification:manage:own',
    'call:initiate:booking','call:receive:booking','call:record:consent','call:manage:provider',
    'payment:create:own','payment:read:own','payment:method:manage:own','payment:refund:request','payment:process:provider','payment:payout:receive',
    'finance:report:own','finance:report:provider','finance:manage:all','tax:document:own','tax:document:provider',
    'role:read:all','role:assign:all',
    'user:impersonate:all','data:export:organization','reporting:analytics:all','config:platform:all'
  ]

  const permIds = new Map<string,string>()
  for (const p of permissionStrings) {
    const [resource, action, scope] = p.split(':')
    const id = await upsertPermission(supabase, resource, action, scope, p)
    permIds.set(p, id)
  }

  // Role -> permission mapping (essential subset; extend as needed)
  const grant = async (role: string, perms: string[]) => {
    const rid = roleIds.get(role)
    if (!rid) throw new Error(`role missing: ${role}`)
    for (const p of perms) {
      const pid = permIds.get(p)
      if (pid) await attach(supabase, rid, pid)
    }
  }

  // Basic Client
  await grant('Basic Client', [
    'user:read:own','user:update:own','user:delete:own',
    'auth:login:own','auth:logout:own','auth:reset:own','security:view:own',
    'service:search:all','service:view:public','service:review:create','service:review:manage:own','service:favorite:manage',
    'booking:create:own','booking:read:own','booking:update:own','booking:cancel:own','booking:reschedule:mutual',
    'message:read:own','message:manage:own','notification:receive:own','notification:manage:own',
    'payment:create:own','payment:read:own','payment:method:manage:own','payment:refund:request',
    'finance:report:own','tax:document:own'
  ])

  // Premium Client inherits Basic (logical, same seed here)
  await grant('Premium Client', Array.from(permIds.keys()).filter(k => [
    'user:read:own','user:update:own','user:delete:own','auth:login:own','auth:logout:own','auth:reset:own','security:view:own',
    'service:search:all','service:view:public','service:review:create','service:review:manage:own','service:favorite:manage',
    'booking:create:own','booking:read:own','booking:update:own','booking:cancel:own','booking:reschedule:mutual',
    'message:read:own','message:manage:own','notification:receive:own','notification:manage:own',
    'payment:create:own','payment:read:own','payment:method:manage:own','payment:refund:request','finance:report:own','tax:document:own'
  ].includes(k)))

  // Enterprise Client = Premium + data export if exists
  await grant('Enterprise Client', ['data:export:organization'])

  // Client Administrator = Enterprise + role assign (scoped by org via app logic)
  await grant('Client Administrator', ['role:assign:all','role:read:all'])

  // Individual Provider
  await grant('Individual Provider', [
    'service:create:own','service:read:own','service:update:own','service:delete:own',
    'booking:read:provider','booking:manage:provider','booking:confirm:provider','booking:start:provider','booking:complete:provider',
    'message:send:booking','call:initiate:booking','call:receive:booking','call:record:consent','call:manage:provider',
    'payment:process:provider','payment:payout:receive','finance:report:provider','tax:document:provider'
  ])

  // Provider Team Member (subset) — reuse provider perms without payout
  await grant('Provider Team Member', [
    'booking:read:provider','booking:manage:provider','message:send:booking','call:initiate:booking','call:receive:booking'
  ])

  // Provider Manager/Admin inherit via union
  await grant('Provider Manager', ['service:read:all'])
  await grant('Provider Administrator', ['service:read:all'])

  // Support Agent / Content Moderator
  await grant('Support Agent', ['user:read:all','user:update:all'])
  await grant('Content Moderator', ['service:moderate:all','message:moderate:all'])

  // Platform/System Admin
  await grant('Platform Administrator', ['user:read:all','user:update:all','user:create:all','role:assign:all','finance:manage:all','security:manage:all','reporting:analytics:all'])
  await grant('System Administrator', ['config:platform:all','user:impersonate:all'])

  // Refresh MV
  await supabase.rpc('rbac_refresh_user_permissions_mv')
}

seed().then(() => {
  console.log('RBAC seed complete')
  process.exit(0)
}).catch(err => {
  console.error('RBAC seed failed', err)
  process.exit(1)
})


