'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Row } from '@tanstack/react-table'
import { Plus, TrashBin } from '@gravity-ui/icons'

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

import { GenerateInvoicesModal } from '../modals/generate-invoices-modal'
import { InvoiceModal } from '../modals/invoice-modal'
import { PaymentModal } from '../modals/payment-modal'
import { getInvoiceColumns, invoiceColumnClassNames } from './invoice-columns'
import type {
  BillingInvoice,
  BillingInvoiceGenerationInput,
  BillingInvoiceGenerationResult,
  BillingInvoiceInput,
  BillingInvoiceVoidAllResult,
  BillingPayment,
  BillingPaymentInput,
  BillingSubscriberOption,
} from './types'

type DueAccountsClientProps = {
  initialInvoices: BillingInvoice[]
  initialGenerationResult: BillingInvoiceGenerationResult | null
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

  formData.set('invoiceId', input.invoiceId ?? '')
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

function renderInvoiceExpandedRow(row: Row<BillingInvoice>) {
  return (
    <div className='border-t bg-muted/20 px-4 py-3'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Account Number</p>
          <p className='text-sm font-mono text-foreground'>{row.original.accountNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Contact</p>
          <p className='text-sm text-foreground'>{row.original.phoneNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Plan</p>
          <p className='text-sm text-foreground'>{row.original.plan || '-'}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Invoice Date</p>
          <p className='text-sm text-foreground'>{row.original.invoiceDate}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Expiration</p>
          <p className='text-sm text-foreground'>{row.original.expirationDate}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-2'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Service Period</p>
          <p className='text-sm text-foreground'>{row.original.servicePeriod}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Paid</p>
          <p className='text-sm font-medium text-foreground'>{currencyFormatter.format(row.original.paidAmount)}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-4'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Notes</p>
          <p className='text-sm text-foreground'>{row.original.notes || '-'}</p>
        </div>
      </div>
    </div>
  )
}

export function DueAccountsClient({
  initialInvoices,
  initialGenerationResult,
  subscribers,
}: DueAccountsClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [generationResult, setGenerationResult] = useState<BillingInvoiceGenerationResult | null>(
    initialGenerationResult,
  )
  const [voidAllResult, setVoidAllResult] = useState<BillingInvoiceVoidAllResult | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<BillingInvoice | null>(null)
  const [pendingVoidInvoice, setPendingVoidInvoice] = useState<BillingInvoice | null>(null)
  const [isVoidAllOpen, setIsVoidAllOpen] = useState(false)
  const isCreateOpen = searchParams.get('create') === '1'
  const totalDue = invoices.reduce((total, invoice) => total + invoice.balance, 0)
  const partialInvoices = invoices.filter((invoice) => invoice.status === 'Partial').length
  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'Overdue').length

  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const handleCreateInvoice = async (input: BillingInvoiceInput) => {
    const response = await fetch('/api/billing/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Unable to create invoice', await readApiError(response, 'Unable to create invoice'))
      return false
    }

    const { invoice } = (await response.json()) as { invoice: BillingInvoice }

    if (invoice.status !== 'Paid' && invoice.status !== 'Void') {
      setInvoices((currentInvoices) => [invoice, ...currentInvoices])
    }
    closeCreateModal()

    return true
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

    const { invoice } = (await response.json()) as {
      payment: BillingPayment
      invoice: BillingInvoice
    }

    setInvoices((currentInvoices) =>
      invoice.status === 'Paid'
        ? currentInvoices.filter((currentInvoice) => currentInvoice.id !== invoice.id)
        : currentInvoices.map((currentInvoice) => (currentInvoice.id === invoice.id ? invoice : currentInvoice)),
    )
    setPaymentInvoice(null)

    return true
  }

  const handleGenerateInvoices = async (input: BillingInvoiceGenerationInput) => {
    const response = await fetch('/api/billing/invoices/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Unable to generate invoices', await readApiError(response, 'Unable to generate invoices'))
      return false
    }

    const result = (await response.json()) as BillingInvoiceGenerationResult

    setInvoices((currentInvoices) => [...result.invoices, ...currentInvoices])
    setGenerationResult(result)
    setIsGenerateOpen(false)

    return true
  }

  const handleVoidInvoice = async () => {
    if (!pendingVoidInvoice) return

    const response = await fetch(`/api/billing/invoices/${pendingVoidInvoice.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'Void' }),
    })

    if (!response.ok) {
      console.error('Unable to void invoice', await readApiError(response, 'Unable to void invoice'))
      return
    }

    setInvoices((currentInvoices) =>
      currentInvoices.filter((invoice) => invoice.id !== pendingVoidInvoice.id),
    )
    setPendingVoidInvoice(null)
  }

  const handleVoidAllInvoices = async () => {
    const response = await fetch('/api/billing/invoices/void-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceIds: invoices.map((invoice) => invoice.id),
      }),
    })

    if (!response.ok) {
      console.error('Unable to void invoices', await readApiError(response, 'Unable to void invoices'))
      return
    }

    const result = (await response.json()) as BillingInvoiceVoidAllResult

    setInvoices((currentInvoices) =>
      currentInvoices.filter((invoice) => !result.voidedIds.includes(invoice.id)),
    )
    setVoidAllResult(result)
    setIsVoidAllOpen(false)
  }

  const columns = useMemo(
    () =>
      getInvoiceColumns({
        onPostPayment: setPaymentInvoice,
        onVoid: setPendingVoidInvoice,
      }),
    [],
  )

  return (
    <div className='min-w-0 w-full space-y-4'>
      <div className='flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Invoices</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Track unpaid subscriber invoices, partial balances, and due dates.
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsVoidAllOpen(true)}
            disabled={invoices.length === 0}
          >
            <TrashBin data-icon='inline-start' />
            Void All
          </Button>
          <Button type='button' variant='outline' size='sm' onClick={() => setIsGenerateOpen(true)}>
            <Plus data-icon='inline-start' />
            Generate Invoices
          </Button>
        </div>
      </div>

      {generationResult && (
        <div className='rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground'>
          Generated {generationResult.generated} invoices, skipped {generationResult.skippedExisting} already billed subscribers, skipped {generationResult.skippedWithoutPlan} subscribers without plans, and skipped {generationResult.skippedWithoutInstallation} without installed dates.
        </div>
      )}

      {voidAllResult && (
        <div className='rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground'>
          Voided {voidAllResult.voided} invoices, skipped {voidAllResult.skippedWithPayments} with posted payments, and skipped {voidAllResult.skippedUnavailable} unavailable invoices.
        </div>
      )}

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Total due</p>
          <p className='mt-1 text-2xl font-semibold'>{currencyFormatter.format(totalDue)}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Partial invoices</p>
          <p className='mt-1 text-2xl font-semibold'>{partialInvoices}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Past due</p>
          <p className='mt-1 text-2xl font-semibold'>{overdueInvoices}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        columnClassNames={invoiceColumnClassNames}
        itemLabel='invoices'
        minWidthClassName='min-w-[884px]'
        renderExpandedRow={renderInvoiceExpandedRow}
      />
      <InvoiceModal
        open={isCreateOpen}
        subscribers={subscribers}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
        }}
        onCancel={closeCreateModal}
        onSubmit={handleCreateInvoice}
      />
      <GenerateInvoicesModal
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onCancel={() => setIsGenerateOpen(false)}
        onSubmit={handleGenerateInvoices}
      />
      <PaymentModal
        open={Boolean(paymentInvoice)}
        initialInvoice={paymentInvoice}
        invoices={paymentInvoice ? [paymentInvoice] : invoices}
        subscribers={subscribers}
        onOpenChange={(open) => {
          if (!open) setPaymentInvoice(null)
        }}
        onCancel={() => setPaymentInvoice(null)}
        onSubmit={handleCreatePayment}
      />
      <Dialog
        open={Boolean(pendingVoidInvoice)}
        onOpenChange={(open) => {
          if (!open) setPendingVoidInvoice(null)
        }}
      >
        <DialogContent className='max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Void invoice?</DialogTitle>
            <DialogDescription>
              {pendingVoidInvoice?.invoiceNumber} will be removed from Invoices.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='ghost' size='sm' onClick={() => setPendingVoidInvoice(null)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' size='sm' onClick={handleVoidInvoice}>
              Void
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isVoidAllOpen}
        onOpenChange={setIsVoidAllOpen}
      >
        <DialogContent className='max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Void all invoices?</DialogTitle>
            <DialogDescription>
              This will void every listed invoice that has no posted payments. Invoices with payments will be skipped.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='ghost' size='sm' onClick={() => setIsVoidAllOpen(false)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' size='sm' onClick={handleVoidAllInvoices}>
              Void All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
