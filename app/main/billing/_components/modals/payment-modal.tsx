'use client'

import { useMemo, useState } from 'react'
import { addDays } from 'date-fns'
import { CalendarIcon, ChevronDownIcon, SearchIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type {
  BillingPaymentInput,
  BillingPaymentMethod,
  BillingSubscriberOption,
} from '../data-table/types'
import { cn } from '@/lib/utils'

type PaymentModalProps = {
  open: boolean
  subscribers: BillingSubscriberOption[]
  defaultSubscriberId?: string
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

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const parseDateValue = (value: string) => {
  if (!value) return undefined

  const [yearValue, monthValue, dayValue] = value.split('-').map(Number)
  if (!yearValue || !monthValue || !dayValue) return undefined

  return new Date(yearValue, monthValue - 1, dayValue)
}

const displayDate = (value: string) => {
  const date = parseDateValue(value)

  if (!date) return 'Pick a date'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

type DatePickerFieldProps = {
  id: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}

function DatePickerField({
  id,
  value,
  invalid,
  onChange,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const date = parseDateValue(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          className={cn(
            'h-10 w-full justify-start bg-background/40 text-left font-normal',
            !value && 'text-muted-foreground',
          )}
          aria-invalid={invalid}
        >
          <CalendarIcon data-icon='inline-start' />
          {displayDate(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={(nextDate) => {
            if (!nextDate) return

            onChange(formatDateValue(nextDate))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export function PaymentModal({
  open,
  subscribers,
  defaultSubscriberId = '',
  onOpenChange,
  onCancel,
  onSubmit,
}: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <PaymentModalContent
          subscribers={subscribers}
          defaultSubscriberId={defaultSubscriberId}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}

type PaymentModalContentProps = Pick<PaymentModalProps, 'subscribers' | 'defaultSubscriberId' | 'onCancel' | 'onSubmit'>

function PaymentModalContent({
  subscribers,
  defaultSubscriberId = '',
  onCancel,
  onSubmit,
}: PaymentModalContentProps) {
  const defaultSubscriber = subscribers.find((subscriber) => subscriber.id === defaultSubscriberId)
  const [form, setForm] = useState(() => ({
    subscriberId: defaultSubscriber?.id ?? '',
    amount: '',
    expirationDate: defaultSubscriber?.expirationDateValue ?? '',
    paymentDate: todayValue(),
    method: 'Cash' as BillingPaymentMethod,
    referenceNumber: '',
    collector: '',
    receiptPhoto: null as File | null,
    notes: '',
  }))
  const [showErrors, setShowErrors] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [subscriberPickerOpen, setSubscriberPickerOpen] = useState(false)
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const selectedSubscriber = useMemo(
    () => subscribers.find((subscriber) => subscriber.id === form.subscriberId),
    [form.subscriberId, subscribers],
  )
  const visibleSubscribers = useMemo(() => {
    const normalizedSearch = subscriberSearch.trim().toLowerCase()
    const matchingSubscribers = normalizedSearch
      ? subscribers.filter((subscriber) =>
          [
            subscriber.name,
            subscriber.accountNumber,
            subscriber.phoneNumber,
            subscriber.plan,
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch)),
        )
      : subscribers

    return matchingSubscribers.slice(0, 5)
  }, [subscriberSearch, subscribers])
  const expirationInThirtyDays = addDays(parseDateValue(form.expirationDate) ?? new Date(), 30)
  const expirationInThirtyDaysValue = formatDateValue(expirationInThirtyDays)
  const expirationInThirtyDaysLabel = displayDate(expirationInThirtyDaysValue)

  const handleSubscriberChange = (subscriberId: string) => {
    const subscriber = subscribers.find((option) => option.id === subscriberId)

    setSubscriberPickerOpen(false)
    setSubscriberSearch('')
    setForm((current) => ({
      ...current,
      subscriberId,
      expirationDate: subscriber?.expirationDateValue ?? '',
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
      !form.expirationDate ||
      !form.paymentDate ||
      !Number.isFinite(amount) ||
      amount <= 0

    setShowErrors(hasErrors)
    if (hasErrors || isSaving) return

    setIsSaving(true)
    const wasSaved = await onSubmit({
      subscriberId: form.subscriberId,
      expirationDate: form.expirationDate,
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
    <DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-[640px] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)]'>
      <DialogHeader className='shrink-0 border-b px-6 py-4 pr-12'>
        <DialogTitle>Post Payment</DialogTitle>
        <DialogDescription>
          Record a subscriber payment and its service expiration date.
        </DialogDescription>
      </DialogHeader>
      <div className='grid flex-1 gap-4 overflow-y-auto px-6 py-4'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-subscriber'>
              Subscriber
            </label>
            <Popover open={subscriberPickerOpen} onOpenChange={setSubscriberPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id='payment-subscriber'
                  type='button'
                  variant='outline'
                  role='combobox'
                  aria-expanded={subscriberPickerOpen}
                  className={cn(
                    'h-10 w-full justify-between bg-background/40 px-3 text-left font-normal',
                    !selectedSubscriber && 'text-muted-foreground',
                  )}
                >
                  <span className='truncate'>
                    {selectedSubscriber
                      ? `${selectedSubscriber.name} - ${selectedSubscriber.accountNumber}`
                      : 'Select subscriber'}
                  </span>
                  <ChevronDownIcon data-icon='inline-end' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-[var(--radix-popover-trigger-width)] min-w-[340px] gap-1 p-1'>
                <div>
                  <div className='relative'>
                    <SearchIcon className='pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      aria-label='Search subscribers'
                      className='h-8 pl-7 text-sm'
                      placeholder='Search name, account, phone'
                      value={subscriberSearch}
                      onChange={(event) => setSubscriberSearch(event.target.value)}
                      onKeyDown={(event) => event.stopPropagation()}
                    />
                  </div>
                </div>
                <div className='flex max-h-56 flex-col gap-1 overflow-y-auto'>
                  {visibleSubscribers.map((subscriber) => (
                    <Button
                      key={subscriber.id}
                      type='button'
                      variant='ghost'
                      className='h-auto justify-start px-2 py-2 text-left font-normal'
                      onClick={() => handleSubscriberChange(subscriber.id)}
                    >
                      <span className='grid min-w-0 gap-0.5'>
                        <span className='truncate font-medium'>
                          {subscriber.name} - {subscriber.accountNumber}
                        </span>
                        <span className='truncate text-xs text-muted-foreground'>
                          {[subscriber.phoneNumber, subscriber.plan].filter(Boolean).join(' | ') || 'No details'}
                        </span>
                      </span>
                    </Button>
                  ))}
                  {visibleSubscribers.length === 0 && (
                    <div className='px-2 py-2 text-sm text-muted-foreground'>
                      No subscribers found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between gap-2'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='payment-expires'>
                Expires
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='xs'
                    aria-label={`Add 30 days, setting expiration to ${expirationInThirtyDaysLabel}`}
                    onClick={() => setForm((current) => ({
                      ...current,
                      expirationDate: formatDateValue(addDays(
                        parseDateValue(current.expirationDate) ?? new Date(),
                        30,
                      )),
                    }))}
                  >
                    +30 days
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='top'>
                  Next expiration: {expirationInThirtyDaysLabel}
                </TooltipContent>
              </Tooltip>
            </div>
            <DatePickerField
              id='payment-expires'
              value={form.expirationDate}
              invalid={showErrors && !form.expirationDate}
              onChange={(expirationDate) => setForm((current) => ({ ...current, expirationDate }))}
            />
          </div>
        </div>

        {selectedSubscriber && (
          <div className='grid gap-2 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-4'>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Account</p>
              <p className='truncate font-mono font-medium'>{selectedSubscriber.accountNumber}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Plan</p>
              <p className='truncate font-medium'>{selectedSubscriber.plan || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Status</p>
              <p className='truncate font-medium'>{selectedSubscriber.billingStatus}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Phone</p>
              <p className='truncate font-medium'>{selectedSubscriber.phoneNumber || '-'}</p>
            </div>
            <div className='min-w-0 sm:col-span-2'>
              <p className='text-xs text-muted-foreground'>Current expiration</p>
              <p className='truncate font-medium'>{selectedSubscriber.expirationDate || '-'}</p>
            </div>
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
            <DatePickerField
              id='payment-date'
              value={form.paymentDate}
              invalid={showErrors && !form.paymentDate}
              onChange={(paymentDate) => setForm((current) => ({ ...current, paymentDate }))}
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
            Select a subscriber, choose an expiration date, and enter a valid amount.
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
