'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { Branch, BranchStatus } from '../data-table/types'

type BranchModalProps = {
  branch?: Branch | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: (branch: Branch) => void
}

const branchStatuses: BranchStatus[] = ['Active', 'Maintenance', 'Inactive']

const emptyForm = {
  code: '',
  name: '',
  address: '',
  subscribers: '0',
  status: 'Active' as BranchStatus,
}

export function BranchModal({
  branch,
  open,
  onOpenChange,
  onCancel,
  onSubmit,
}: BranchModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [showErrors, setShowErrors] = useState(false)
  const isEditing = Boolean(branch)

  useEffect(() => {
    if (!open) return

    setForm(
      branch
        ? {
            code: branch.code,
            name: branch.name,
            address: branch.address,
            subscribers: String(branch.subscribers),
            status: branch.status,
          }
        : emptyForm,
    )
    setShowErrors(false)
  }, [branch, open])

  const resetForm = () => {
    setForm(emptyForm)
    setShowErrors(false)
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  const handleSubmit = () => {
    const cleanCode = form.code.trim().toUpperCase()
    const cleanName = form.name.trim()
    const cleanAddress = form.address.trim()
    const subscribers = Number(form.subscribers)
    const hasErrors =
      !cleanCode ||
      !cleanName ||
      !cleanAddress ||
      !Number.isInteger(subscribers) ||
      subscribers < 0

    setShowErrors(hasErrors)
    if (hasErrors) return

    onSubmit({
      id: branch?.id ?? `pending-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      address: cleanAddress,
      subscribers,
      status: form.status,
      updatedAt: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    })

    if (!isEditing) resetForm()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className='flex w-[calc(100vw-1rem)] max-w-[560px] flex-col overflow-hidden p-0 sm:w-[calc(100vw-2rem)]'>
        <DialogHeader className='border-b p-4 pr-12 sm:p-5'>
          <DialogTitle className='text-base'>{isEditing ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the branch details used for coverage and subscriber assignment.'
              : 'Create a branch location for subscriber and service coverage.'}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 p-4 sm:p-5'>
          <div className='grid gap-3 sm:grid-cols-[140px_1fr]'>
            <div className='grid gap-1.5'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='branch-code'>
                Branch code
              </label>
              <Input
                id='branch-code'
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder='RIZ'
                className='font-mono uppercase'
                aria-invalid={showErrors && !form.code.trim()}
              />
              {showErrors && !form.code.trim() && (
                <p className='text-xs text-destructive'>Enter a branch code.</p>
              )}
            </div>
            <div className='grid gap-1.5'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='branch-name'>
                Branch name
              </label>
              <Input
                id='branch-name'
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder='Rizal'
                aria-invalid={showErrors && !form.name.trim()}
              />
              {showErrors && !form.name.trim() && (
                <p className='text-xs text-destructive'>Enter a branch name.</p>
              )}
            </div>
          </div>
          <div className='grid gap-1.5'>
            <label className='text-[13px] font-medium sm:text-sm' htmlFor='branch-address'>
              Location
            </label>
            <Input
              id='branch-address'
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              placeholder='San Jose City'
              aria-invalid={showErrors && !form.address.trim()}
            />
            {showErrors && !form.address.trim() && (
              <p className='text-xs text-destructive'>Enter a location.</p>
            )}
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-1.5'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='branch-subscribers'>
                Subscribers
              </label>
              <Input
                id='branch-subscribers'
                inputMode='numeric'
                value={form.subscribers}
                onChange={(event) => setForm((current) => ({ ...current, subscribers: event.target.value }))}
                placeholder='0'
                aria-invalid={
                  showErrors &&
                  (!Number.isInteger(Number(form.subscribers)) || Number(form.subscribers) < 0)
                }
              />
              {showErrors &&
                (!Number.isInteger(Number(form.subscribers)) || Number(form.subscribers) < 0) && (
                  <p className='text-xs text-destructive'>Enter a valid subscriber count.</p>
                )}
            </div>
            <div className='grid gap-1.5'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='branch-status'>
                Status
              </label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, status: value as BranchStatus }))
                }
              >
                <SelectTrigger id='branch-status' className='h-10 w-full bg-background/40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branchStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className='border-t bg-muted/10 p-4 sm:p-4'>
          <Button type='button' variant='ghost' size='sm' onClick={handleCancel}>
            Cancel
          </Button>
          <Button type='button' size='sm' onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
