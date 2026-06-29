import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUserManager } from '@/lib/system-users'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireUserManager()
    const { id } = await params
    const body = await request.json() as { name?: string; branchRequired?: boolean; permissions?: string[] }
    const name = body.name?.trim() ?? ''
    if (!name) return NextResponse.json({ error: 'Permission name is required' }, { status: 400 })
    const admin = createAdminClient()
    const { data: existing } = await admin.from('system_roles').select('is_admin').eq('id', id).maybeSingle()
    if (existing?.is_admin) return NextResponse.json({ error: 'The built-in Super Admin role cannot be modified' }, { status: 400 })
    const { data, error } = await admin.from('system_roles').update({ name, branch_required: Boolean(body.branchRequired), updated_at: new Date().toISOString() }).eq('id', id).select('id, name, branch_required, created_at').single()
    if (error) throw error
    if (!body.branchRequired) await admin.from('profiles').update({ branch_id: null }).eq('role_id', id)
    const keys = body.permissions ?? []
    const { data: catalog } = await admin.from('permissions').select('id, resource, action')
    await admin.from('role_permissions').delete().eq('role_id', id)
    const mappings = (catalog ?? []).filter((item) => keys.includes(`${item.resource}.${item.action}`)).map((item) => ({ role_id: id, permission_id: item.id }))
    if (mappings.length) await admin.from('role_permissions').insert(mappings)
    return NextResponse.json({ permission: { id: data.id, name: data.name, branchRequired: data.branch_required, createdAt: data.created_at, permissions: keys, isBuiltIn: false } })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update permission' }, { status: 500 }) }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireUserManager()
    const { id } = await params
    const admin = createAdminClient()
    const { data: existing } = await admin.from('system_roles').select('is_admin').eq('id', id).maybeSingle()
    if (existing?.is_admin) return NextResponse.json({ error: 'The built-in Super Admin role cannot be deleted' }, { status: 400 })
    const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', id)
    if (count) return NextResponse.json({ error: 'Reassign users before deleting this permission' }, { status: 409 })
    const { error } = await admin.from('system_roles').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete permission' }, { status: 500 }) }
}
