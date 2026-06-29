import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireUserManager } from '@/lib/system-users'
import type { SystemPermission } from '@/lib/system-permission-types'

export async function listSystemPermissions(): Promise<SystemPermission[]> {
  await requireUserManager()
  const { data, error } = await createAdminClient().from('system_roles').select('id, name, branch_required, is_admin, created_at, role_permissions(permission:permissions(resource, action))').order('name')
  if (error) throw new Error(`Unable to load permissions: ${error.message}`)
  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    branchRequired: item.branch_required,
    createdAt: item.created_at,
    isBuiltIn: item.is_admin,
    permissions: item.role_permissions.flatMap((entry) => {
      const related = entry.permission as unknown as { resource: string; action: string } | { resource: string; action: string }[] | null
      const records = Array.isArray(related) ? related : related ? [related] : []
      return records.map((permission) => `${permission.resource}.${permission.action}`)
    }),
  }))
}
