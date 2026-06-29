'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
import { DataTable } from '@/components/data-table/shared/data-table'
import { Button } from '@/components/ui/button'

import { PaymentModal } from '../modals/payment-modal'
import { getPaymentColumns, paymentColumnClassNames } from './payment-columns'
import type {
  BillingPayment,
  BillingPaymentInput,
  BillingSubscriberOption,
} from './types'

type PaymentsClientProps = {
  initialPayments: BillingPayment[]
  subscribers: BillingSubscriberOption[]
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const readApiError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null

  return body?.error ?? fallback
}

const paymentInputToFormData = (input: BillingPaymentInput) => {
  const formData = new FormData()

  formData.set('subscriberId', input.subscriberId)
  formData.set('expirationDate', input.expirationDate)
  formData.set('amount', String(input.amount))
  formData.set('paymentDate', input.paymentDate)
  formData.set('method', input.method)
  formData.set('referenceNumber', input.referenceNumber)
  formData.set('collector', input.collector)
  formData.set('notes', input.notes)

  if (input.receiptPhoto) {
    formData.set('receiptPhoto', input.receiptPhoto)
  }

  return formData
}

export function PaymentsClient({
  initialPayments,
  subscribers,
}: PaymentsClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const branchFilter = searchParams.get('branch') ?? 'all'
  const [payments, setPayments] = useState(initialPayments)
  const [pendingDeletePayment, setPendingDeletePayment] = useState<BillingPayment | null>(null)
  const isCreateOpen = searchParams.get('create') === '1'
  const visiblePayments = branchFilter === 'all'
    ? payments
    : payments.filter((payment) => payment.branchId === branchFilter)
  const postedPayments = visiblePayments.filter((payment) => payment.status === 'Posted')
  const totalPosted = postedPayments.reduce((total, payment) => total + payment.amount, 0)
  const todaysPayments = postedPayments.filter((payment) => {
    const today = new Date().toISOString().slice(0, 10)
    return payment.paymentDateValue === today
  })

  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const handleCreatePayment = async (input: BillingPaymentInput) => {
    const response = await fetch('/api/billing/payments', {
      method: 'POST',
      body: paymentInputToFormData(input),
    })

    if (!response.ok) {
      console.error('Unable to post payment', await readApiError(response, 'Unable to post payment'))
      return false
    }

    const { payment } = (await response.json()) as {
      payment: BillingPayment
    }

    setPayments((currentPayments) => [payment, ...currentPayments])
    closeCreateModal()
    router.refresh()

    return true
  }

  const handleDeletePayment = async () => {
    if (!pendingDeletePayment) return

    const response = await fetch(`/api/billing/payments/${pendingDeletePayment.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.error('Unable to delete payment', await readApiError(response, 'Unable to delete payment'))
      return
    }

    setPayments((currentPayments) =>
      currentPayments.filter((payment) => payment.id !== pendingDeletePayment.id),
    )
    setPendingDeletePayment(null)
    router.refresh()
  }

  const columns = useMemo(
    () =>
      getPaymentColumns({
        onDelete: setPendingDeletePayment,
      }),
    [],
  )

  return (
    <div className='flex min-w-0 w-full flex-col gap-4'>
      <div className='flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='min-w-0 lg:max-w-md'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Payments</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Record subscriber payments and update renewal dates directly.
          </p>
        </div>
        <div className='grid w-full gap-2 sm:grid-cols-3 lg:max-w-2xl lg:flex-1'>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>Posted payments</p>
            <p className='mt-0.5 text-xl font-semibold'>{postedPayments.length}</p>
          </div>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>Today</p>
            <p className='mt-0.5 text-xl font-semibold'>{currencyFormatter.format(todaysPayments.reduce((total, payment) => total + payment.amount, 0))}</p>
          </div>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>All collected</p>
            <p className='mt-0.5 text-xl font-semibold'>{currencyFormatter.format(totalPosted)}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={visiblePayments}
        columnClassNames={paymentColumnClassNames}
        itemLabel='payments'
        minWidthClassName='min-w-[932px]'
      />
      <PaymentModal
        open={isCreateOpen}
        subscribers={subscribers}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
        }}
        onCancel={closeCreateModal}
        onSubmit={handleCreatePayment}
      />
      <Dialog
        open={Boolean(pendingDeletePayment)}
        onOpenChange={(open) => {
          if (!open) setPendingDeletePayment(null)
        }}
      >
        <DialogContent className='max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Delete payment?</DialogTitle>
            <DialogDescription>
              This will remove the payment record for {pendingDeletePayment?.subscriberName}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='ghost' size='sm' onClick={() => setPendingDeletePayment(null)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' size='sm' onClick={handleDeletePayment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
