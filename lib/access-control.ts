import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAIN_LANDING_ROUTES = [
  { resource: 'dashboard', path: '/main/overview' },
  { resource: 'manager_view', path: '/main/overview/manager-view' },
  { resource: 'subscribers', path: '/main/subscribers' },
  { resource: 'installations', path: '/main/installations' },
  { resource: 'job_orders', path: '/main/job-orders' },
  { resource: 'service_requests', path: '/main/service-request' },
  { resource: 'payments', path: '/main/payments' },
  { resource: 'expirations', path: '/main/expirations' },
  { resource: 'collections', path: '/main/collections' },
  { resource: 'subscription_plans', path: '/main/subscription-plans' },
  { resource: 'modems', path: '/main/modems' },
  { resource: 'branches', path: '/main/branches' },
  { resource: 'system_users', path: '/main/users' },
]

type PermissionRecord = { resource: string; action: string }
type RolePermissionRecord = { permission: PermissionRecord | PermissionRecord[] | null }

export function canAccess(permissions: string[], resource: string, action = 'view') {
  return permissions.includes('*') || permissions.includes(`${resource}.${action}`)
}

export function getMainLandingPath(permissions: string[], fallback = '/main/overview') {
  return MAIN_LANDING_ROUTES.find((route) => canAccess(permissions, route.resource))?.path ?? fallback
}

export async function getCurrentMainPermissions() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims?.sub) return []

  const { data: profile, error } = await createAdminClient()
    .from('profiles')
    .select('system_role:system_roles(is_admin, role_permissions(permission:permissions(resource, action)))')
    .eq('id', claims.sub)
    .maybeSingle()

  if (error) throw new Error(`Unable to load permissions: ${error.message}`)

  const systemRole = Array.isArray(profile?.system_role) ? profile.system_role[0] : profile?.system_role
  if (systemRole?.is_admin) return ['*']

  return ((systemRole?.role_permissions ?? []) as RolePermissionRecord[]).flatMap((entry) => {
    const related = entry.permission
    const records = Array.isArray(related) ? related : related ? [related] : []
    return records.map((permission) => `${permission.resource}.${permission.action}`)
  })
}
