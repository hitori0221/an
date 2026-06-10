'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

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

import type { Subscriber } from '../data-table/types'

const plans = ['Basic 50 Mbps', 'Fiber 100 Mbps', 'Fiber 200 Mbps', 'Fiber 300 Mbps']
const statuses = ['Active', 'Suspended', 'Inactive']

type SubscriberFormProps = {
  nextAccountNumber: string
  onCancel: () => void
  onSubmit: (subscriber: Subscriber) => void
}

type FormState = {
  name: string
  phoneNumber: string
  plan: string
  city: string
  barangay: string
  status: string
}

const initialFormState: FormState = {
  name: '',
  phoneNumber: '',
  plan: 'Fiber 100 Mbps',
  city: '',
  barangay: '',
  status: 'Active',
}

export function SubscriberForm({
  nextAccountNumber,
  onCancel,
  onSubmit,
}: SubscriberFormProps) {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [showErrors, setShowErrors] = useState(false)

  const hasErrors =
    !form.name.trim() ||
    !form.phoneNumber.trim() ||
    !form.plan ||
    !form.city.trim() ||
    !form.barangay.trim() ||
    !form.status

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)

    if (hasErrors) return

    onSubmit({
      id: nextAccountNumber,
      accountNumber: nextAccountNumber,
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(),
      plan: form.plan,
      city: form.city.trim(),
      barangay: form.barangay.trim(),
      status: form.status,
    })

    setForm(initialFormState)
    setShowErrors(false)
  }

  return (
    <form className='flex min-h-0 flex-col' onSubmit={handleSubmit}>
      <div className='grid max-h-[min(68vh,620px)] gap-4 overflow-y-auto px-4 pb-4 sm:grid-cols-2'>
        <div className='flex flex-col gap-1.5 sm:col-span-2'>
          <label className='text-sm font-medium' htmlFor='subscriber-account-number'>
            Account Number
          </label>
          <Input
            id='subscriber-account-number'
            value={nextAccountNumber}
            readOnly
            className='font-mono'
          />
        </div>

        <div className='flex flex-col gap-1.5 sm:col-span-2'>
          <label className='text-sm font-medium' htmlFor='subscriber-name'>
            Subscriber Name
          </label>
          <Input
            id='subscriber-name'
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            aria-invalid={showErrors && !form.name.trim()}
          />
          {showErrors && !form.name.trim() && (
            <p className='text-xs text-destructive'>Enter the subscriber name.</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='subscriber-phone'>
            Phone Number
          </label>
          <Input
            id='subscriber-phone'
            value={form.phoneNumber}
            onChange={(event) => updateField('phoneNumber', event.target.value)}
            aria-invalid={showErrors && !form.phoneNumber.trim()}
          />
          {showErrors && !form.phoneNumber.trim() && (
            <p className='text-xs text-destructive'>Enter a phone number.</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='subscriber-plan'>
            Plan
          </label>
          <Select value={form.plan} onValueChange={(value) => updateField('plan', value)}>
            <SelectTrigger id='subscriber-plan' className='w-full'>
              <SelectValue placeholder='Select plan' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {plans.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='subscriber-city'>
            City
          </label>
          <Input
            id='subscriber-city'
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
            aria-invalid={showErrors && !form.city.trim()}
          />
          {showErrors && !form.city.trim() && (
            <p className='text-xs text-destructive'>Enter the city.</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor='subscriber-barangay'>
            Barangay
          </label>
          <Input
            id='subscriber-barangay'
            value={form.barangay}
            onChange={(event) => updateField('barangay', event.target.value)}
            aria-invalid={showErrors && !form.barangay.trim()}
          />
          {showErrors && !form.barangay.trim() && (
            <p className='text-xs text-destructive'>Enter the barangay.</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5 sm:col-span-2'>
          <label className='text-sm font-medium' htmlFor='subscriber-status'>
            Status
          </label>
          <Select value={form.status} onValueChange={(value) => updateField('status', value)}>
            <SelectTrigger id='subscriber-status' className='w-full'>
              <SelectValue placeholder='Select status' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex justify-end gap-2 border-t p-4'>
        <Button type='button' variant='outline' size='sm' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' size='sm'>
          Add Subscriber
        </Button>
      </div>
    </form>
  )
}
