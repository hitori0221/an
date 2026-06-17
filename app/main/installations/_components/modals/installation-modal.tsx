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
  Installation,
  InstallationInput,
  InstallationStatus,
  InstallationSubscriberOption,
} from '../data-table/types'

type InstallationModalProps = {
  installation?: Installation | null
  open: boolean
  subscribers: InstallationSubscriberOption[]
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: (installation: InstallationInput) => Promise<boolean>
}

const installationStatuses: InstallationStatus[] = [
  'Pending',
  'Scheduled',
  'In Progress',
  'Installed',
  'Failed',
  'Cancelled',
]

const emptyForm: InstallationInput = {
  subscriberId: '',
  technician: '',
  crew: '',
  scheduleDate: '',
  status: 'Pending',
  materials: '',
  notes: '',
}

export function InstallationModal({
  installation,
  open,
  subscribers,
  onOpenChange,
  onCancel,
  onSubmit,
}: InstallationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <InstallationModalContent
          key={installation?.id ?? 'create'}
          installation={installation}
          subscribers={subscribers}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}

type InstallationModalContentProps = Pick<
  InstallationModalProps,
  'installation' | 'subscribers' | 'onCancel' | 'onSubmit'
>

function InstallationModalContent({
  installation,
  subscribers,
  onCancel,
  onSubmit,
}: InstallationModalContentProps) {
  const isEditing = Boolean(installation)
  const hasSubscriberOptions = subscribers.length > 0
  const [form, setForm] = useState<InstallationInput>(() =>
    installation
      ? {
          subscriberId: installation.subscriberId,
          technician: installation.technician,
          crew: installation.crew,
          scheduleDate: installation.scheduleDateValue,
          status: installation.status,
          materials: installation.materials,
          notes: installation.notes,
        }
      : emptyForm,
  )
  const [showErrors, setShowErrors] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const selectedSubscriber = useMemo(
    () => subscribers.find((subscriber) => subscriber.id === form.subscriberId),
    [form.subscriberId, subscribers],
  )

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
    const hasErrors = !isEditing && (!hasSubscriberOptions || !form.subscriberId)

    setShowErrors(hasErrors)
    if (hasErrors || isSaving) return

    setIsSaving(true)
    const wasSaved = await onSubmit({
      ...form,
      technician: form.technician.trim(),
      crew: form.crew.trim(),
      materials: form.materials.trim(),
      notes: form.notes.trim(),
    })
    setIsSaving(false)

    if (wasSaved && !isEditing) resetForm()
  }

  return (
    <DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-[620px] flex-col overflow-hidden gap-0 p-0 sm:max-h-[calc(100dvh-4rem)]'>
      <DialogHeader className='shrink-0 border-b px-6 py-4 pr-12'>
        <DialogTitle>{isEditing ? 'Edit Installation' : 'Add Installation'}</DialogTitle>
        <DialogDescription>
          Select the pending subscriber and prepare the installation item.
        </DialogDescription>
      </DialogHeader>
      <div className='grid flex-1 gap-4 overflow-y-auto px-6 py-4'>
        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='installation-subscriber'>
            Subscriber
          </label>
          <Select
            value={form.subscriberId}
            onValueChange={(value) => setForm((current) => ({ ...current, subscriberId: value }))}
            disabled={isEditing || !hasSubscriberOptions}
          >
            <SelectTrigger
              id='installation-subscriber'
              className='h-10 w-full bg-background/40'
              aria-invalid={showErrors && !form.subscriberId}
            >
              <SelectValue placeholder='Select subscriber' />
            </SelectTrigger>
            <SelectContent className='w-[var(--radix-select-trigger-width)] min-w-[360px]'>
              <SelectGroup>
                {hasSubscriberOptions ? (
                  subscribers.map((subscriber) => (
                    <SelectItem key={subscriber.id} value={subscriber.id} className='min-h-10 py-2'>
                      <span className='flex min-w-0 flex-1 items-center justify-between gap-3'>
                        <span className='truncate'>{subscriber.name}</span>
                        <span className='truncate font-mono text-xs text-muted-foreground'>
                          {subscriber.accountNumber}
                        </span>
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <div className='px-2 py-3 text-sm text-muted-foreground'>
                    No pending subscribers are available for installation.
                  </div>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          {!isEditing && !hasSubscriberOptions && (
            <p className='text-xs text-muted-foreground'>
              Create or move a subscriber to pending first before adding an installation.
            </p>
          )}
          {showErrors && !form.subscriberId && (
            <p className='text-xs text-destructive'>Select a subscriber.</p>
          )}
        </div>

        {(selectedSubscriber || installation) && (
          <div className='grid gap-2 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-2'>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Plan</p>
              <p className='truncate font-medium'>{selectedSubscriber?.plan || installation?.plan || '-'}</p>
            </div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Contact</p>
              <p className='truncate font-medium'>
                {selectedSubscriber?.phoneNumber || installation?.phoneNumber || '-'}
              </p>
            </div>
            <div className='min-w-0 sm:col-span-2'>
              <p className='text-xs text-muted-foreground'>Address</p>
              <p className='truncate font-medium'>{selectedSubscriber?.address || installation?.address || '-'}</p>
            </div>
          </div>
        )}

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='installation-technician'>
              Technician
            </label>
            <Input
              id='installation-technician'
              value={form.technician}
              onChange={(event) => setForm((current) => ({ ...current, technician: event.target.value }))}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='installation-crew'>
              Crew
            </label>
            <Input
              id='installation-crew'
              value={form.crew}
              onChange={(event) => setForm((current) => ({ ...current, crew: event.target.value }))}
            />
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='installation-schedule'>
              Schedule
            </label>
            <Input
              id='installation-schedule'
              type='date'
              value={form.scheduleDate}
              onChange={(event) => setForm((current) => ({ ...current, scheduleDate: event.target.value }))}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='installation-status'>
              Status
            </label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, status: value as InstallationStatus }))
              }
            >
              <SelectTrigger id='installation-status' className='h-10 w-full bg-background/40'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {installationStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='installation-materials'>
            Materials
          </label>
          <textarea
            id='installation-materials'
            value={form.materials}
            onChange={(event) => setForm((current) => ({ ...current, materials: event.target.value }))}
            className='min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <label className='text-[13px] font-medium sm:text-sm' htmlFor='installation-notes'>
            Notes
          </label>
          <textarea
            id='installation-notes'
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
        <Button type='button' size='sm' onClick={handleSubmit} disabled={isSaving || (!isEditing && !hasSubscriberOptions)}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
