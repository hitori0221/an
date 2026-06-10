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

import { jobOrderPriorities, problemCategories, technicians } from '../data-table/data'
import type { JobOrder, JobOrderPriority, ProblemCategory } from '../data-table/types'
import type { Subscriber } from '@/app/main/subscribers/_components/data-table/types'

type JobOrderFormProps = {
  nextTicketNumber: string
  subscribers: Subscriber[]
  onCancel: () => void
  onSubmit: (jobOrder: JobOrder) => void
}

type FormState = {
  accountNumber: string
  technician: string
  problemCategory: ProblemCategory | ''
  priority: JobOrderPriority | ''
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
    technician: technicians[0],
    problemCategory: '',
    priority: 'Medium',
    problemDetails: '',
  })
  const [showErrors, setShowErrors] = useState(false)

  const selectedSubscriber = useMemo(
    () => subscribers.find((subscriber) => subscriber.accountNumber === form.accountNumber),
    [form.accountNumber, subscribers],
  )

  const hasErrors =
    !selectedSubscriber ||
    !form.technician ||
    !form.problemCategory ||
    !form.priority ||
    !form.problemDetails.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)

    if (hasErrors || !selectedSubscriber || !form.problemCategory || !form.priority) {
      return
    }

    onSubmit({
      id: nextTicketNumber,
      ticketNumber: nextTicketNumber,
      accountNumber: selectedSubscriber.accountNumber,
      subscriberName: selectedSubscriber.name,
      phoneNumber: selectedSubscriber.phoneNumber,
      plan: selectedSubscriber.plan,
      city: selectedSubscriber.city,
      barangay: selectedSubscriber.barangay,
      problemCategory: form.problemCategory,
      problemDetails: form.problemDetails.trim(),
      priority: form.priority,
      technician: form.technician,
      status: 'Assigned',
      createdDate: 'May 30, 2026',
      lastUpdate: 'Created from the operations job order drawer.',
      activities: [
        {
          id: `${nextTicketNumber}-A1`,
          title: 'Created ticket',
          description: `${form.problemCategory} issue logged from the operations drawer.`,
          timestamp: 'May 30, 2026 01:36 AM',
        },
        {
          id: `${nextTicketNumber}-A2`,
          title: 'Assigned technician',
          description: `Assigned to ${form.technician}.`,
          timestamp: 'May 30, 2026 01:36 AM',
        },
      ],
    })

    setForm({
      accountNumber: '',
      technician: technicians[0],
      problemCategory: '',
      priority: 'Medium',
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

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-sm font-medium' htmlFor='job-order-technician'>
              Technician
            </label>
            <Select
              value={form.technician}
              onValueChange={(value) => setForm((current) => ({ ...current, technician: value }))}
            >
              <SelectTrigger id='job-order-technician' className='w-full'>
                <SelectValue placeholder='Select technician' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {technicians.map((technician) => (
                    <SelectItem key={technician} value={technician}>
                      {technician}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-sm font-medium' htmlFor='job-order-priority'>
              Priority
            </label>
            <Select
              value={form.priority}
              onValueChange={(value) => setForm((current) => ({ ...current, priority: value as JobOrderPriority }))}
            >
              <SelectTrigger id='job-order-priority' className='w-full'>
                <SelectValue placeholder='Select priority' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {jobOrderPriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
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
        >
          Create Ticket
        </Button>
      </div>
    </form>
  )
}
