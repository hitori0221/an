'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { problemCategories } from '../data-table/data'
import type { JobOrderInput, JobOrderSubscriberOption, ProblemCategory } from '../data-table/types'

type JobOrderFormProps = {
  nextTicketNumber: string
  subscribers: JobOrderSubscriberOption[]
  onCancel: () => void
  onSubmit: (input: JobOrderInput) => Promise<boolean>
}

type FormState = {
  accountNumber: string
  technician: string
  problemCategory: ProblemCategory | ''
  problemDetails: string
}

const fieldClassName =
  'h-9 rounded-md border border-border bg-background px-3 text-sm shadow-none outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const textAreaClassName =
  'min-h-28 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function JobOrderForm({
  nextTicketNumber,
  subscribers,
  onCancel,
  onSubmit,
}: JobOrderFormProps) {
  const [form, setForm] = useState<FormState>({
    accountNumber: '',
    technician: '',
    problemCategory: '',
    problemDetails: '',
  })
  const [showErrors, setShowErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedSubscriber = useMemo(
    () => subscribers.find((subscriber) => subscriber.accountNumber === form.accountNumber),
    [form.accountNumber, subscribers],
  )

  const hasErrors =
    !selectedSubscriber ||
    !form.technician.trim() ||
    !form.problemCategory ||
    !form.problemDetails.trim()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)

    if (hasErrors || !selectedSubscriber || !form.problemCategory) {
      return
    }

    setIsSubmitting(true)
    const didCreate = await onSubmit({
      ticketNumber: nextTicketNumber,
      subscriberId: selectedSubscriber.id,
      problemCategory: form.problemCategory,
      problemDetails: form.problemDetails.trim(),
      technician: form.technician.trim(),
    }).finally(() => setIsSubmitting(false))

    if (!didCreate) return

    setForm({
      accountNumber: '',
      technician: '',
      problemCategory: '',
      problemDetails: '',
    })
    setShowErrors(false)
  }

  return (
    <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
      <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4'>
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='job-order-ticket'>
            Ticket Number
          </label>
          <input
            id='job-order-ticket'
            className={fieldClassName}
            value={nextTicketNumber}
            readOnly
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='job-order-subscriber'>
            Subscriber
          </label>
          <Select
            value={form.accountNumber}
            onValueChange={(value) => setForm((current) => ({ ...current, accountNumber: value }))}
          >
            <SelectTrigger
              id='job-order-subscriber'
              className='w-full'
              aria-invalid={showErrors && !selectedSubscriber}
            >
              <SelectValue placeholder='Select subscriber' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {subscribers.map((subscriber) => (
                  <SelectItem key={subscriber.accountNumber} value={subscriber.accountNumber}>
                    {subscriber.name} - {subscriber.accountNumber}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {showErrors && !selectedSubscriber && (
            <p className='text-xs text-destructive'>Select a subscriber.</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='job-order-technician'>
            Technician
          </label>
          <input
            id='job-order-technician'
            className={fieldClassName}
            value={form.technician}
            placeholder='Enter technician name'
            onChange={(event) => setForm((current) => ({ ...current, technician: event.target.value }))}
            aria-invalid={showErrors && !form.technician.trim()}
          />
          {showErrors && !form.technician.trim() && (
            <p className='text-xs text-destructive'>Enter a technician name.</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='job-order-problem'>
            Problem Category
          </label>
          <Select
            value={form.problemCategory}
            onValueChange={(value) => setForm((current) => ({ ...current, problemCategory: value as ProblemCategory }))}
          >
            <SelectTrigger
              id='job-order-problem'
              className='w-full'
              aria-invalid={showErrors && !form.problemCategory}
            >
              <SelectValue placeholder='Select problem' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {problemCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {showErrors && !form.problemCategory && (
            <p className='text-xs text-destructive'>Select a problem category.</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='job-order-details'>
            Problem Details
          </label>
          <textarea
            id='job-order-details'
            className={textAreaClassName}
            placeholder='Describe the problem reported by the subscriber.'
            value={form.problemDetails}
            onChange={(event) => setForm((current) => ({ ...current, problemDetails: event.target.value }))}
            aria-invalid={showErrors && !form.problemDetails.trim()}
          />
          {showErrors && !form.problemDetails.trim() && (
            <p className='text-xs text-destructive'>Enter the problem details.</p>
          )}
        </div>

        {selectedSubscriber && (
          <div className='rounded-md border bg-muted/30 p-3 text-sm'>
            <p className='font-medium text-foreground'>{selectedSubscriber.name}</p>
            <p className='text-muted-foreground'>{selectedSubscriber.phoneNumber}</p>
            <p className='text-muted-foreground'>
              {selectedSubscriber.barangay}, {selectedSubscriber.city}
            </p>
          </div>
        )}
      </div>

      <div className='mt-auto flex justify-end gap-2 border-t p-4'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          size='sm'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  )
}
