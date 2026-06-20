'use client'

import { useState } from 'react'

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

import type { BillingInvoiceGenerationInput } from '../data-table/types'

type GenerateInvoicesModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: (input: BillingInvoiceGenerationInput) => Promise<boolean>
}

const currentBillingPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const emptyForm = {
  billingPeriod: currentBillingPeriod(),
  notes: '',
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

export function GenerateInvoicesModal({
  open,
  onOpenChange,
  onCancel,
  onSubmit,
}: GenerateInvoicesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <GenerateInvoicesModalContent onCancel={onCancel} onSubmit={onSubmit} />
      ) : null}
    </Dialog>
  )
}

type GenerateInvoicesModalContentProps = Pick<GenerateInvoicesModalProps, 'onCancel' | 'onSubmit'>

function GenerateInvoicesModalContent({
  onCancel,
  onSubmit,
}: GenerateInvoicesModalContentProps) {
  const [form, setForm] = useState(emptyForm)
  const [showErrors, setShowErrors] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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

  const handleSubmit = async () => {
    const hasErrors = !form.billingPeriod

    setShowErrors(hasErrors)
    if (hasErrors || isSaving) return

    setIsSaving(true)
    const wasSaved = await onSubmit({
      billingPeriod: form.billingPeriod,
      notes: form.notes.trim(),
    })
    setIsSaving(false)

    if (wasSaved) resetForm()
  }

  return (
    <DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-[520px] flex-col overflow-hidden gap-0 p-0 sm:max-h-[calc(100dvh-4rem)]'>
      <DialogHeader className='shrink-0 border-b px-6 py-4 pr-12'>
        <DialogTitle>Generate Invoices</DialogTitle>
        <DialogDescription>
          Create invoices for installed subscribers whose next billing date falls inside the selected period.
        </DialogDescription>
      </DialogHeader>
      <div className='grid flex-1 gap-4 overflow-y-auto px-6 py-4'>
        <div className='grid gap-3'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='generate-billing-period'>
              Billing period
            </label>
            <Input
              id='generate-billing-period'
              type='month'
              value={form.billingPeriod}
              onChange={(event) => setForm((current) => ({ ...current, billingPeriod: event.target.value }))}
              aria-invalid={showErrors && !form.billingPeriod}
            />
          </div>
        </div>
        {showErrors && !form.billingPeriod && (
          <p className='text-xs text-destructive'>Enter a valid billing period.</p>
        )}
        {servicePeriod && (
          <div className='rounded-md border bg-muted/20 px-3 py-2 text-sm'>
            <p className='text-xs text-muted-foreground'>Service period</p>
            <p className='font-medium'>{servicePeriod}</p>
          </div>
        )}
        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='generate-notes'>
            Notes
          </label>
          <textarea
            id='generate-notes'
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
          {isSaving ? 'Generating...' : 'Generate'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
