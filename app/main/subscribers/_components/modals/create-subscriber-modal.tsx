'use client'

import { Dialog as DialogPrimitive } from 'radix-ui'
import { AnimatePresence, motion } from 'motion/react'
import { Xmark as XIcon } from '@gravity-ui/icons'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { SubscriberForm } from '../forms/subscriber-form'
import type { Subscriber } from '../data-table/types'

type CreateSubscriberModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextAccountNumber: string
  onCancel: () => void
  onSubmit: (subscriber: Subscriber) => void
}

export function CreateSubscriberModal({
  open,
  onOpenChange,
  nextAccountNumber,
  onCancel,
  onSubmit,
}: CreateSubscriberModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className='fixed inset-0 z-50 bg-black/50'
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-[560px] flex-col overflow-hidden rounded-md border bg-background shadow-lg',
                )}
                initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-46%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-46%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <div className='flex flex-col gap-1.5 p-4 pr-12'>
                  <DialogPrimitive.Title className='font-semibold text-foreground'>
                    Add Subscriber
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                    Create a subscriber account and service profile.
                  </DialogPrimitive.Description>
                </div>
                <SubscriberForm
                  nextAccountNumber={nextAccountNumber}
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
