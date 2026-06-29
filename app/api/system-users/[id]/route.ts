import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireUserManager } from '@/lib/system-users'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireUserManager()
    const { id } = await params
    const body = await request.json() as { email?: string; password?: string; fullName?: string; permissionId?: string; branchId?: string | null }
    const email = body.email?.trim().toLowerCase() ?? ''
    const fullName = body.fullName?.trim() ?? ''
    const admin = createAdminClient()
    const { data: permissionRecord } = await admin.from('system_roles').select('id, name, branch_required, is_admin').eq('id', body.permissionId ?? '').maybeSingle()
    const branchId = permissionRecord?.branch_required ? body.branchId ?? null : null
    const role = permissionRecord?.is_admin ? 'admin' : 'staff'
    if (!email || !fullName || !permissionRecord || (permissionRecord.branch_required && !branchId) || (body.password && body.password.length < 8)) return NextResponse.json({ error: 'Enter a valid name, email, permission, branch, and password' }, { status: 400 })
    const { data, error } = await admin.auth.admin.updateUserById(id, {
      email, ...(body.password ? { password: body.password } : {}),
      user_metadata: { full_name: fullName }, app_metadata: { role, role_id: permissionRecord.id, branch_id: branchId },
    })
    if (error) throw error
    const { error: profileError } = await admin.from('profiles').update({ email, full_name: fullName, role, role_id: permissionRecord.id, permission: permissionRecord.is_admin ? 'administrator' : 'operations', branch_id: branchId, updated_at: new Date().toISOString() }).eq('id', id)
    if (profileError) throw profileError
    const { data: branch } = branchId ? await admin.from('branches').select('name').eq('id', branchId).maybeSingle() : { data: null }
    return NextResponse.json({ user: { id, email, fullName, role, permission: permissionRecord.is_admin ? 'administrator' : 'operations', permissionId: permissionRecord.id, permissionName: permissionRecord.name, branchRequired: permissionRecord.branch_required, branchId, branchName: branch?.name ?? null, createdAt: data.user.created_at, lastSignInAt: data.user.last_sign_in_at ?? null } })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unable to update user'
    const missingMigration = /permission|branch_id|schema cache/i.test(rawMessage)
    const message = missingMigration ? 'The user permissions database migration has not been applied yet.' : rawMessage
    return NextResponse.json({ error: message }, { status: /administrators/.test(message) ? 403 : missingMigration ? 503 : 500 })
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const currentUserId = await requireUserManager()
    const { id } = await params
    if (id === currentUserId) return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    const { error } = await createAdminClient().auth.admin.deleteUser(id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete user'
    return NextResponse.json({ error: message }, { status: /administrators/.test(message) ? 403 : 500 })
  }
}
