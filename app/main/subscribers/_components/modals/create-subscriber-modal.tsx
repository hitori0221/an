'use client'

import { Dialog as DialogPrimitive } from 'radix-ui'
import { AnimatePresence, motion } from 'motion/react'
import { Xmark as XIcon } from '@gravity-ui/icons'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { SubscriberForm } from '../forms/subscriber-form'
import type { SubscriberFormSubmitResult } from '../forms/subscriber-form'
import type {
  Subscriber,
  SubscriberBranchOption,
  SubscriberCategoryField,
  SubscriberModemOption,
  SubscriberPlanOption,
  SubscriberSubscriptionCategoryGroupOption,
  SubscriberSubscriptionCategoryOption,
} from '../data-table/types'

type CreateSubscriberModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextAccountNumber: string
  subscriber?: Subscriber | null
  categories: SubscriberSubscriptionCategoryOption[]
  categoryGroups: SubscriberSubscriptionCategoryGroupOption[]
  plans: SubscriberPlanOption[]
  branches: SubscriberBranchOption[]
  modems: SubscriberModemOption[]
  categoryFields: SubscriberCategoryField[]
  onCancel: () => void
  onSubmit: (formData: FormData) => Promise<SubscriberFormSubmitResult>
}

export function CreateSubscriberModal({
  open,
  onOpenChange,
  nextAccountNumber,
  subscriber,
  categories,
  categoryGroups,
  plans,
  branches,
  modems,
  categoryFields,
  onCancel,
  onSubmit,
}: CreateSubscriberModalProps) {
  const isEditing = Boolean(subscriber)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-background shadow-lg',
                )}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <div className='flex shrink-0 flex-col gap-1.5 border-b p-4 pr-12 sm:px-6'>
                  <DialogPrimitive.Title className='text-lg font-semibold text-foreground'>
                    {isEditing ? 'Edit Subscriber' : 'Add Subscriber'}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                    {isEditing
                      ? 'Update the subscriber account, contract details, and service profile.'
                      : 'Create a subscriber account, contract details, and service profile.'}
                  </DialogPrimitive.Description>
                </div>
                <SubscriberForm
                  key={`${subscriber?.id ?? 'create'}:${nextAccountNumber}`}
                  nextAccountNumber={nextAccountNumber}
                  subscriber={subscriber}
                  submitLabel={isEditing ? 'Save Subscriber' : 'Add Subscriber'}
                  categories={categories}
                  categoryGroups={categoryGroups}
                  plans={plans}
                  branches={branches}
                  modems={modems}
                  categoryFields={categoryFields}
                  onCancel={onCancel}
                  onSubmit={onSubmit}
                />
                <DialogPrimitive.Close asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
                    aria-label='Close subscriber form'
                  >
                    <XIcon aria-hidden='true' />
                  </Button>
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
