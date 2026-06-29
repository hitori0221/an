import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listSystemPermissions } from '@/lib/system-permissions'
import { requireUserManager } from '@/lib/system-users'

export async function GET() {
  try { return NextResponse.json({ permissions: await listSystemPermissions() }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load permissions' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    await requireUserManager()
    const body = await request.json() as { name?: string; branchRequired?: boolean; permissions?: string[] }
    const name = body.name?.trim() ?? ''
    if (!name) return NextResponse.json({ error: 'Permission name is required' }, { status: 400 })
    const admin = createAdminClient()
    const { data, error } = await admin.from('system_roles').insert({ name, branch_required: Boolean(body.branchRequired) }).select('id, name, branch_required, created_at').single()
    if (error) throw error
    const keys = body.permissions ?? []
    if (keys.length) {
      const { data: catalog } = await admin.from('permissions').select('id, resource, action')
      await admin.from('role_permissions').insert((catalog ?? []).filter((item) => keys.includes(`${item.resource}.${item.action}`)).map((item) => ({ role_id: data.id, permission_id: item.id })))
    }
    return NextResponse.json({ permission: { id: data.id, name: data.name, branchRequired: data.branch_required, createdAt: data.created_at, permissions: keys, isBuiltIn: false } }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create permission' }, { status: 500 }) }
}
