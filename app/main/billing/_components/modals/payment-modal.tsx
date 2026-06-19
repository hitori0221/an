'use client'

import { useMemo, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type {
  BillingInvoice,
  BillingPaymentInput,
  BillingPaymentMethod,
  BillingSubscriberOption,
} from '../data-table/types'

type PaymentModalProps = {
  open: boolean
  invoices: BillingInvoice[]
  subscribers: BillingSubscriberOption[]
  initialInvoice?: BillingInvoice | null
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: (payment: BillingPaymentInput) => Promise<boolean>
}

const paymentMethods: BillingPaymentMethod[] = [
  'Cash',
  'GCash',
  'Bank Transfer',
  'Card',
  'Check',
  'Other',
]

const todayValue = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function PaymentModal({
  open,
  invoices,
  subscribers,
  initialInvoice,
  onOpenChange,
  onCancel,
  onSubmit,
}: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <PaymentModalContent
          key={initialInvoice?.id ?? 'create'}
          invoices={invoices}
          subscribers={subscribers}
          initialInvoice={initialInvoice}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}

type PaymentModalContentProps = Pick<
  PaymentModalProps,
  'invoices' | 'subscribers' | 'initialInvoice' | 'onCancel' | 'onSubmit'
>

function PaymentModalContent({
  invoices,
  subscribers,
  initialInvoice,
  onCancel,
  onSubmit,
}: PaymentModalContentProps) {
  const [form, setForm] = useState(() => ({
    subscriberId: initialInvoice?.subscriberId ?? '',
    invoiceId: initialInvoice?.id ?? '',
    amount: initialInvoice ? String(initialInvoice.balance) : '',
    paidUntil: initialInvoice?.servicePeriodEndValue ?? '',
    paymentDate: todayValue(),
    method: 'Cash' as BillingPaymentMethod,
    referenceNumber: '',
    collector: '',
    receiptPhoto: null as File | null,
    notes: '',
  }))
  const [showErrors, setShowErrors] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const selectedSubscriber = useMemo(
    () => subscribers.find((subscriber) => subscriber.id === form.subscriberId),
    [form.subscriberId, subscribers],
  )
  const invoiceOptions = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.subscriberId === form.subscriberId)
        .sort((first, second) => first.servicePeriodEndValue.localeCompare(second.servicePeriodEndValue)),
    [form.subscriberId, invoices],
  )
  const selectedInvoice = useMemo(
    () =>
      invoices.find((invoice) => invoice.id === form.invoiceId) ??
      invoiceOptions.find((invoice) => invoice.servicePeriodEndValue === form.paidUntil),
    [form.invoiceId, form.paidUntil, invoiceOptions, invoices],
  )

  const handleSubscriberChange = (subscriberId: string) => {
    const firstInvoice = invoices
      .filter((invoice) => invoice.subscriberId === subscriberId)
      .sort((first, second) => first.servicePeriodEndValue.localeCompare(second.servicePeriodEndValue))[0]

    setForm((current) => ({
      ...current,
      subscriberId,
      invoiceId: firstInvoice?.id ?? '',
      paidUntil: firstInvoice?.servicePeriodEndValue ?? '',
      amount: firstInvoice ? String(firstInvoice.balance) : '',
    }))
  }

  const handlePaidUntilChange = (paidUntil: string) => {
    const invoice = invoiceOptions.find((option) => option.servicePeriodEndValue === paidUntil)

    setForm((current) => ({
      ...current,
      paidUntil,
      invoiceId: invoice?.id ?? '',
      amount: invoice ? String(invoice.balance) : current.amount,
    }))
  }

  const handleCancel = () => {
    setShowErrors(false)
    setIsSaving(false)
    onCancel()
  }

  const handleSubmit = async () => {
    const amount = Number(form.amount)
    const hasErrors =
      !form.subscriberId ||
      !form.paidUntil ||
      !selectedInvoice ||
      !form.paymentDate ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Boolean(selectedInvoice && amount > selectedInvoice.balance)

    setShowErrors(hasErrors)
    if (hasErrors || isSaving) return

    setIsSaving(true)
    const wasSaved = await onSubmit({
      invoiceId: form.invoiceId,
      subscriberId: form.subscriberId,
      paidUntil: form.paidUntil,
      amount,
      paymentDate: form.paymentDate,
      method: form.method,
      referenceNumber: form.referenceNumber.trim(),
      collector: form.collector.trim(),
      receiptPhoto: form.receiptPhoto,
      notes: form.notes.trim(),
    })
    setIsSaving(false)

    if (wasSaved) {
      setShowErrors(false)
    }
  }

  return (
    <DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-[640px] flex-col overflow-hidden gap-0 p-0 sm:max-h-[calc(100dvh-4rem)]'>
      <DialogHeader className='shrink-0 border-b px-6 py-4 pr-12'>
        <DialogTitle>Post Payment</DialogTitle>
        <DialogDescription>
          Record a subscriber payment and mark service paid until the selected expiration date.
        </DialogDescription>
      </DialogHeader>
      <div className='grid flex-1 gap-4 overflow-y-auto px-6 py-4'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-subscriber'>
              Subscriber
            </label>
            <Select
              value={form.subscriberId}
              onValueChange={handleSubscriberChange}
              disabled={Boolean(initialInvoice)}
            >
              <SelectTrigger id='payment-subscriber' className='h-10 w-full bg-background/40'>
                <SelectValue placeholder='Select subscriber' />
              </SelectTrigger>
              <SelectContent className='w-[var(--radix-select-trigger-width)] min-w-[340px]'>
                <SelectGroup>
                  {subscribers.map((subscriber) => (
                    <SelectItem key={subscriber.id} value={subscriber.id}>
                      {subscriber.name} - {subscriber.accountNumber}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-paid-until'>
              Expiration date
            </label>
            <Input
              id='payment-paid-until'
              type='date'
              value={form.paidUntil}
              onChange={(event) => handlePaidUntilChange(event.target.value)}
              disabled={!form.subscriberId || Boolean(initialInvoice)}
              aria-invalid={showErrors && (!form.paidUntil || !selectedInvoice)}
            />
          </div>
        </div>

        {(selectedSubscriber || selectedInvoice) && (
          <div className='grid gap-2 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-4'>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Account</p>
              <p className='truncate font-mono font-medium'>{selectedSubscriber?.accountNumber || selectedInvoice?.accountNumber || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Plan</p>
              <p className='truncate font-medium'>{selectedSubscriber?.plan || selectedInvoice?.plan || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Balance</p>
              <p className='truncate font-medium'>PHP {(selectedInvoice?.balance ?? 0).toLocaleString('en-PH')}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Billing item</p>
              <p className='truncate font-medium'>{selectedInvoice?.invoiceNumber ?? '-'}</p>
            </div>
            {selectedInvoice && (
              <div className='min-w-0 sm:col-span-4'>
                <p className='text-xs text-muted-foreground'>Service period</p>
                <p className='truncate font-medium'>{selectedInvoice.servicePeriod}</p>
              </div>
            )}
          </div>
        )}

        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-amount'>
              Amount
            </label>
            <Input
              id='payment-amount'
              inputMode='decimal'
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              aria-invalid={showErrors && (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0)}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-date'>
              Payment date
            </label>
            <Input
              id='payment-date'
              type='date'
              value={form.paymentDate}
              onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))}
              aria-invalid={showErrors && !form.paymentDate}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-method'>
              Method
            </label>
            <Select
              value={form.method}
              onValueChange={(value) => setForm((current) => ({ ...current, method: value as BillingPaymentMethod }))}
            >
              <SelectTrigger id='payment-method' className='h-10 w-full bg-background/40'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        {showErrors && (
          <p className='text-xs text-destructive'>
            Select a subscriber, choose an expiration date with an open billing item, and enter a valid amount.
          </p>
        )}

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-reference'>
              Reference number
            </label>
            <Input
              id='payment-reference'
              value={form.referenceNumber}
              onChange={(event) => setForm((current) => ({ ...current, referenceNumber: event.target.value }))}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-collector'>
              Collector
            </label>
            <Input
              id='payment-collector'
              value={form.collector}
              onChange={(event) => setForm((current) => ({ ...current, collector: event.target.value }))}
            />
          </div>
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-receipt-photo'>
            Receipt photo
          </label>
          <Input
            id='payment-receipt-photo'
            type='file'
            accept='image/jpeg,image/png,image/webp'
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setForm((current) => ({ ...current, receiptPhoto: file }))
            }}
          />
          {form.receiptPhoto && (
            <p className='truncate text-xs text-muted-foreground'>{form.receiptPhoto.name}</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-notes'>
            Notes
          </label>
          <textarea
            id='payment-notes'
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className='min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
          />
        </div>
      </div>
      <DialogFooter className='shrink-0 border-t bg-muted/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]'>
        <Button type='button' variant='ghost' size='sm' onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type='button' size='sm' onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Post payment'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
