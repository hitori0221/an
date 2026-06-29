'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
import { DataTable } from '@/components/data-table/shared/data-table'
import { Button } from '@/components/ui/button'
import type { ServiceRequest, ServiceRequestStatus } from '@/lib/service-requests'
import { getServiceRequestColumns, serviceRequestColumnClassNames } from './service-request-columns'

export function ServiceRequestsClient({ category, status, requests }: {
  category: string
  status: ServiceRequestStatus | 'All'
  requests: ServiceRequest[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<ServiceRequest | null>(null)
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const columns = useMemo(() => getServiceRequestColumns({ onVerify: (request) => {
    setSelected(request); setRemark(''); setError('')
  } }), [])

  const changeStatus = (next: ServiceRequestStatus | 'All') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('status', next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const verify = async () => {
    if (!selected) return
    setSaving(true); setError('')
    const response = await fetch(`/api/service-requests/${selected.id}/verify`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remark }),
    })
    const body = await response.json().catch(() => null) as { error?: string } | null
    if (!response.ok) { setError(body?.error ?? 'Unable to verify request'); setSaving(false); return }
    setSelected(null); setRemark(''); setSaving(false); router.refresh()
  }

  return (
    <div className='flex min-w-0 w-full flex-col gap-4'>
      <div className='flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='min-w-0 lg:max-w-md'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>{category || 'Service Request'}</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>Review subscriber payments and confirm service activation.</p>
        </div>
        <div className='flex w-full items-center gap-1 rounded-md border bg-background p-1 shadow-xs sm:w-auto'>
          {(['Pending', 'Verified', 'All'] as const).map((item) => (
            <Button key={item} type='button' size='sm' variant={status === item ? 'secondary' : 'ghost'} className='flex-1 sm:flex-none' onClick={() => changeStatus(item)}>{item}</Button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={requests} columnClassNames={serviceRequestColumnClassNames} itemLabel='service requests' minWidthClassName='min-w-[900px]' />

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !saving) setSelected(null) }}>
        <DialogContent className='max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Verify service request?</DialogTitle>
            <DialogDescription>Confirm {selected?.subscriberName}&apos;s {category} service after reviewing the payment.</DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <label htmlFor='verification-remark' className='text-sm font-medium'>Remark <span className='font-normal text-muted-foreground'>(optional)</span></label>
            <textarea id='verification-remark' value={remark} onChange={(event) => setRemark(event.target.value)} rows={4} maxLength={1000} placeholder='Add verification notes' className='w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring' />
            {error && <p role='alert' className='text-sm text-destructive'>{error}</p>}
          </div>
          <DialogFooter>
            <Button type='button' variant='ghost' size='sm' onClick={() => setSelected(null)} disabled={saving}>Cancel</Button>
            <Button type='button' size='sm' onClick={verify} disabled={saving}>{saving ? 'Verifying...' : 'Verify'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
