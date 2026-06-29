'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Branch } from '@/app/main/branches/_components/data-table/types'
import type { SystemUser } from '@/lib/system-user-types'
import type { SystemPermission } from '@/lib/system-permission-types'

type Payload = { email: string; password?: string; fullName: string; permissionId: string; branchId: string | null }

export function UserModal({ user, branches, permissions, open, onOpenChange, onSave }: { user?: SystemUser | null; branches: Branch[]; permissions: SystemPermission[]; open: boolean; onOpenChange: (open: boolean) => void; onSave: (payload: Payload) => Promise<boolean> }) {
  const [form, setForm] = useState({ fullName: user?.fullName ?? '', email: user?.email ?? '', password: '', permissionId: user?.permissionId ?? permissions[0]?.id ?? '', branchId: user?.branchId ?? '' })
  const selectedPermission = permissions.find((permission) => permission.id === form.permissionId)
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const passwordInvalid = (!user && form.password.length < 8) || (Boolean(form.password) && form.password.length < 8)
  const invalid = !form.fullName.trim() || !form.email.includes('@') || passwordInvalid || !form.permissionId || (selectedPermission?.branchRequired && !form.branchId)
  async function submit() {
    setShowErrors(true)
    if (invalid) return
    setSaving(true)
    const saved = await onSave({ ...form, branchId: selectedPermission?.branchRequired ? form.branchId : null, password: form.password || undefined })
    setSaving(false)
    if (saved) setShowErrors(false)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-[520px] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)]'><DialogHeader className='shrink-0 border-b px-6 py-4 pr-12'><DialogTitle>{user ? 'Edit system user' : 'Create system user'}</DialogTitle><DialogDescription>{user ? 'Update sign-in details and permissions.' : 'Create an account and assign its area of access.'}</DialogDescription></DialogHeader><FieldGroup className='flex-1 gap-4 overflow-y-auto px-6 py-4'>
    <Field data-invalid={showErrors && !form.fullName.trim()}><FieldLabel htmlFor='user-name'>Full name</FieldLabel><Input id='user-name' value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} aria-invalid={showErrors && !form.fullName.trim()} placeholder='Juan Dela Cruz' /></Field>
    <Field data-invalid={showErrors && !form.email.includes('@')}><FieldLabel htmlFor='user-email'>Email address</FieldLabel><Input id='user-email' type='email' value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={showErrors && !form.email.includes('@')} placeholder='juan@company.com' /></Field>
    <Field data-invalid={showErrors && passwordInvalid}><FieldLabel htmlFor='user-password'>{user ? 'New password (optional)' : 'Temporary password'}</FieldLabel><Input id='user-password' type='password' value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} aria-invalid={showErrors && passwordInvalid} placeholder='At least 8 characters' /><FieldDescription>{user ? 'Leave blank to keep the current password.' : 'The user can sign in immediately with this password.'}</FieldDescription></Field>
    <Field><FieldLabel htmlFor='user-permission'>Permission</FieldLabel><Select value={form.permissionId} onValueChange={(permissionId) => setForm({ ...form, permissionId, branchId: permissions.find((item) => item.id === permissionId)?.branchRequired ? form.branchId : '' })}><SelectTrigger id='user-permission' className='w-full'><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{permissions.map((permission) => <SelectItem key={permission.id} value={permission.id}>{permission.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
    {selectedPermission?.branchRequired && <Field data-invalid={showErrors && !form.branchId}><FieldLabel htmlFor='user-branch'>Branch</FieldLabel><Select value={form.branchId} onValueChange={(branchId) => setForm({ ...form, branchId })}><SelectTrigger id='user-branch' className='w-full' aria-invalid={showErrors && !form.branchId}><SelectValue placeholder='Select a branch' /></SelectTrigger><SelectContent><SelectGroup>{branches.filter((branch) => branch.status === 'Active' || branch.id === user?.branchId).map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name} ({branch.code})</SelectItem>)}</SelectGroup></SelectContent></Select><FieldDescription>This permission limits the user to one branch.</FieldDescription></Field>}
  </FieldGroup><DialogFooter className='shrink-0 border-t bg-muted/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]'><Button variant='ghost' size='sm' onClick={() => onOpenChange(false)}>Cancel</Button><Button size='sm' disabled={saving} onClick={submit}>{saving ? 'Saving…' : user ? 'Save changes' : 'Create account'}</Button></DialogFooter></DialogContent></Dialog>
}
