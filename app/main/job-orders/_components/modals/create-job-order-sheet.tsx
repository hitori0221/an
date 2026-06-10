'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/animate-ui/components/radix/sheet'

import { JobOrderForm } from '../forms/job-order-form'
import type { Subscriber } from '@/app/main/subscribers/_components/data-table/types'
import type { JobOrder } from '../data-table/types'

type CreateJobOrderSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextTicketNumber: string
  subscribers: Subscriber[]
  onCancel: () => void
  onSubmit: (jobOrder: JobOrder) => void
}

export function CreateJobOrderSheet({
  open,
  onOpenChange,
  nextTicketNumber,
  subscribers,
  onCancel,
  onSubmit,
}: CreateJobOrderSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:w-[440px]' side='right'>
        <SheetHeader>
          <SheetTitle>Create Job Order</SheetTitle>
          <SheetDescription>
            Assign a technician and describe the subscriber issue.
          </SheetDescription>
        </SheetHeader>
        <JobOrderForm
          nextTicketNumber={nextTicketNumber}
          subscribers={subscribers}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      </SheetContent>
    </Sheet>
  )
}
