import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_USER_PERMISSIONS, SYSTEM_USER_ROLES, type SystemUser, type SystemUserPermission, type SystemUserRole } from '@/lib/system-user-types'

export { SYSTEM_USER_PERMISSIONS, SYSTEM_USER_ROLES, type SystemUser, type SystemUserPermission, type SystemUserRole } from '@/lib/system-user-types'

export async function requireUserManager() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) throw new Error('Unauthorized')

  // Keep the role lookup separate so existing administrators can still apply the
  // permission migration. Selecting a not-yet-created column makes Supabase
  // discard the whole row, including the legacy role.
  const [{ data: profile, error: roleError }, { data: permissionProfile }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
    supabase.from('profiles').select('permission').eq('id', userId).maybeSingle(),
  ])
  if (roleError) throw new Error(`Unable to verify user permissions: ${roleError.message}`)
  if (permissionProfile?.permission !== 'administrator' && profile?.role !== 'admin') {
    throw new Error('Only administrators can manage system users')
  }
  return userId
}

export async function listSystemUsers(): Promise<SystemUser[]> {
  await requireUserManager()
  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authError) throw authError

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, email, full_name, role, permission, role_id, permission_record:system_roles(name, branch_required), branch_id, branch:branches(name), created_at')

  if (profileError) throw new Error(`Unable to load system users: ${profileError.message}`)

  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  return authData.users.map((user) => {
    const profile = byId.get(user.id)
    const permissionRecord = Array.isArray(profile?.permission_record)
      ? profile.permission_record[0]
      : profile?.permission_record as unknown as { name?: string; branch_required?: boolean } | null | undefined
    return {
      id: user.id,
      email: profile?.email ?? user.email ?? '',
      fullName: profile?.full_name ?? '',
      role: SYSTEM_USER_ROLES.includes(profile?.role as SystemUserRole) ? profile?.role as SystemUserRole : 'user',
      permission: SYSTEM_USER_PERMISSIONS.includes(profile?.permission as SystemUserPermission) ? profile?.permission as SystemUserPermission : profile?.role === 'admin' ? 'administrator' : 'operations',
      permissionId: profile?.role_id ?? '',
      permissionName: permissionRecord?.name ?? (profile?.role === 'admin' ? 'Super Admin' : 'Operations'),
      branchRequired: Boolean(permissionRecord?.branch_required),
      branchId: profile?.branch_id ?? null,
      branchName: Array.isArray(profile?.branch) ? profile.branch[0]?.name ?? null : (profile?.branch as unknown as { name?: string } | null | undefined)?.name ?? null,
      createdAt: profile?.created_at ?? user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    }
  })
}
