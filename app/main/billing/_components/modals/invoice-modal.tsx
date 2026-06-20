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
  BillingInvoiceInput,
  BillingSubscriberOption,
} from '../data-table/types'

type InvoiceModalProps = {
  open: boolean
  subscribers: BillingSubscriberOption[]
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: (invoice: BillingInvoiceInput) => Promise<boolean>
}

const currentBillingPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const defaultDueDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`
}

const dueDateForBillingPeriod = (billingPeriod: string) => {
  if (!/^\d{4}-\d{2}$/.test(billingPeriod)) return defaultDueDate()

  return `${billingPeriod}-10`
}

const servicePeriodForBillingPeriod = (billingPeriod: string) => {
  if (!/^\d{4}-\d{2}$/.test(billingPeriod)) return ''

  const [yearValue, monthValue] = billingPeriod.split('-').map(Number)
  const start = new Date(yearValue, monthValue - 1, 1)
  const end = new Date(yearValue, monthValue, 0)
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${formatter.format(start)} - ${formatter.format(end)}`
}

const expirationDateForBillingPeriod = (billingPeriod: string) => {
  if (!/^\d{4}-\d{2}$/.test(billingPeriod)) return ''

  const [yearValue, monthValue] = billingPeriod.split('-').map(Number)

  return `${billingPeriod}-${String(new Date(yearValue, monthValue, 0).getDate()).padStart(2, '0')}`
}

const emptyForm = {
  subscriberId: '',
  billingPeriod: currentBillingPeriod(),
  dueDate: defaultDueDate(),
  expirationDate: expirationDateForBillingPeriod(currentBillingPeriod()),
  amount: '',
  notes: '',
}

export function InvoiceModal({
  open,
  subscribers,
  onOpenChange,
  onCancel,
  onSubmit,
}: InvoiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <InvoiceModalContent
          subscribers={subscribers}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}

type InvoiceModalContentProps = Pick<InvoiceModalProps, 'subscribers' | 'onCancel' | 'onSubmit'>

function InvoiceModalContent({
  subscribers,
  onCancel,
  onSubmit,
}: InvoiceModalContentProps) {
  const [form, setForm] = useState(emptyForm)
  const [showErrors, setShowErrors] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const selectedSubscriber = useMemo(
    () => subscribers.find((subscriber) => subscriber.id === form.subscriberId),
    [form.subscriberId, subscribers],
  )
  const servicePeriod = servicePeriodForBillingPeriod(form.billingPeriod)

  const resetForm = () => {
    setForm(emptyForm)
    setShowErrors(false)
    setIsSaving(false)
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  const handleSubscriberChange = (subscriberId: string) => {
    const subscriber = subscribers.find((option) => option.id === subscriberId)

    setForm((current) => ({
      ...current,
      subscriberId,
      amount: subscriber ? String(subscriber.planPrice) : current.amount,
      dueDate: subscriber?.dueDateValue || current.dueDate,
      expirationDate: subscriber?.expirationDateValue || current.expirationDate,
    }))
  }

  const handleBillingPeriodChange = (billingPeriod: string) => {
    setForm((current) => ({
      ...current,
      billingPeriod,
      dueDate: dueDateForBillingPeriod(billingPeriod),
      expirationDate: expirationDateForBillingPeriod(billingPeriod),
    }))
  }

  const handleSubmit = async () => {
    const amount = Number(form.amount)
    const hasErrors =
      !form.subscriberId ||
      !form.billingPeriod ||
      !form.dueDate ||
      !form.expirationDate ||
      !Number.isFinite(amount) ||
      amount < 0

    setShowErrors(hasErrors)
    if (hasErrors || isSaving) return

    setIsSaving(true)
    const wasSaved = await onSubmit({
      subscriberId: form.subscriberId,
      billingPeriod: form.billingPeriod,
      dueDate: form.dueDate,
      expirationDate: form.expirationDate,
      amount,
      notes: form.notes.trim(),
    })
    setIsSaving(false)

    if (wasSaved) resetForm()
  }

  return (
    <DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-[620px] flex-col overflow-hidden gap-0 p-0 sm:max-h-[calc(100dvh-4rem)]'>
      <DialogHeader className='shrink-0 border-b px-6 py-4 pr-12'>
        <DialogTitle>Add Invoice</DialogTitle>
        <DialogDescription>
          Create a billing item from an active subscriber and their current plan price.
        </DialogDescription>
      </DialogHeader>
      <div className='grid flex-1 gap-4 overflow-y-auto px-6 py-4'>
        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='invoice-subscriber'>
            Subscriber
          </label>
          <Select value={form.subscriberId} onValueChange={handleSubscriberChange}>
            <SelectTrigger
              id='invoice-subscriber'
              className='h-10 w-full bg-background/40'
              aria-invalid={showErrors && !form.subscriberId}
            >
              <SelectValue placeholder='Select subscriber' />
            </SelectTrigger>
            <SelectContent className='w-[var(--radix-select-trigger-width)] min-w-[360px]'>
              <SelectGroup>
                {subscribers.map((subscriber) => (
                  <SelectItem key={subscriber.id} value={subscriber.id} className='min-h-10 py-2'>
                    <span className='flex min-w-0 flex-1 items-center justify-between gap-3'>
                      <span className='truncate'>{subscriber.name}</span>
                      <span className='truncate font-mono text-xs text-muted-foreground'>
                        {subscriber.accountNumber}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {showErrors && !form.subscriberId && (
            <p className='text-xs text-destructive'>Select a subscriber.</p>
          )}
        </div>

        {selectedSubscriber && (
          <div className='grid gap-2 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-3'>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Plan</p>
              <p className='truncate font-medium'>{selectedSubscriber.plan || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Contact</p>
              <p className='truncate font-medium'>{selectedSubscriber.phoneNumber}</p>
            </div>
            <div className='min-w-0 sm:col-span-2'>
              <p className='text-xs text-muted-foreground'>Address</p>
              <p className='truncate font-medium'>{selectedSubscriber.address || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Next billing</p>
              <p className='truncate font-medium'>{selectedSubscriber.nextBillingDate || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Current due</p>
              <p className='truncate font-medium'>{selectedSubscriber.dueDate || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Current expiration</p>
              <p className='truncate font-medium'>{selectedSubscriber.expirationDate || '-'}</p>
            </div>
          </div>
        )}

        <div className='grid gap-3 sm:grid-cols-4'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='billing-period'>
              Billing period
            </label>
            <Input
              id='billing-period'
              type='month'
              value={form.billingPeriod}
              onChange={(event) => handleBillingPeriodChange(event.target.value)}
              aria-invalid={showErrors && !form.billingPeriod}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='invoice-due-date'>
              Due date
            </label>
            <Input
              id='invoice-due-date'
              type='date'
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              aria-invalid={showErrors && !form.dueDate}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='invoice-amount'>
              Amount
            </label>
            <Input
              id='invoice-amount'
              inputMode='decimal'
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              aria-invalid={showErrors && (!Number.isFinite(Number(form.amount)) || Number(form.amount) < 0)}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='invoice-expiration-date'>
              Expiration date
            </label>
            <Input
              id='invoice-expiration-date'
              type='date'
              value={form.expirationDate}
              onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))}
              aria-invalid={showErrors && !form.expirationDate}
            />
          </div>
        </div>
        {showErrors && (!form.billingPeriod || !form.dueDate || !form.expirationDate || !Number.isFinite(Number(form.amount)) || Number(form.amount) < 0) && (
          <p className='text-xs text-destructive'>Enter a valid period, due date, expiration date, and amount.</p>
        )}

        {servicePeriod && (
          <div className='rounded-md border bg-muted/20 px-3 py-2 text-sm'>
            <p className='text-xs text-muted-foreground'>Service period</p>
            <p className='font-medium'>{servicePeriod}</p>
          </div>
        )}

        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='invoice-notes'>
            Notes
          </label>
          <textarea
            id='invoice-notes'
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
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
