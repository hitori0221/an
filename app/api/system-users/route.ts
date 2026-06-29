import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { listSystemUsers, requireUserManager } from '@/lib/system-users'

export const dynamic = 'force-dynamic'

function statusFor(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unable to manage system users'
  const missingMigration = /permission|branch_id|role_id|schema cache|database error creating new user/i.test(rawMessage)
  const message = missingMigration ? 'The user permissions database migration has not been applied yet.' : rawMessage
  return { message, status: /Unauthorized/.test(message) ? 401 : /administrators/.test(message) ? 403 : missingMigration ? 503 : 500 }
}

export async function GET() {
  try {
    return NextResponse.json({ users: await listSystemUsers() })
  } catch (error) {
    const result = statusFor(error)
    return NextResponse.json({ error: result.message }, { status: result.status })
  }
}

export async function POST(request: Request) {
  try {
    await requireUserManager()
    const body = await request.json() as { email?: string; password?: string; fullName?: string; permissionId?: string; branchId?: string | null }
    const email = body.email?.trim().toLowerCase() ?? ''
    const fullName = body.fullName?.trim() ?? ''
    const admin = createAdminClient()
    const { data: permissionRecord } = await admin.from('system_roles').select('id, name, branch_required, is_admin').eq('id', body.permissionId ?? '').maybeSingle()
    const branchId = permissionRecord?.branch_required ? body.branchId ?? null : null
    const role = permissionRecord?.is_admin ? 'admin' : 'staff'
    const permission = permissionRecord?.is_admin ? 'administrator' : 'operations'
    if (!email || !fullName || !body.password || body.password.length < 8 || !permissionRecord || (permissionRecord.branch_required && !branchId)) {
      return NextResponse.json({ error: 'Name, valid email, permission, branch (for billing), and an 8-character password are required' }, { status: 400 })
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      // Keep this complete for the auth.users -> profiles trigger. Authorization
      // still reads the protected app_metadata values, not user-editable metadata.
      user_metadata: { email, full_name: fullName, role, permission, role_id: permissionRecord.id, branch_id: branchId },
      app_metadata: { role, permission, role_id: permissionRecord.id, branch_id: branchId },
    })
    if (error) throw error

    const { error: profileError } = await admin.from('profiles').upsert({
      id: data.user.id, email, full_name: fullName, role, role_id: permissionRecord.id, permission, branch_id: branchId, updated_at: new Date().toISOString(),
    })
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id)
      throw profileError
    }
    const { data: branch } = branchId ? await admin.from('branches').select('name').eq('id', branchId).maybeSingle() : { data: null }
    return NextResponse.json({ user: { id: data.user.id, email, fullName, role, permission, permissionId: permissionRecord.id, permissionName: permissionRecord.name, branchRequired: permissionRecord.branch_required, branchId, branchName: branch?.name ?? null, createdAt: data.user.created_at, lastSignInAt: null } }, { status: 201 })
  } catch (error) {
    const result = statusFor(error)
    return NextResponse.json({ error: result.message }, { status: result.status })
  }
}
