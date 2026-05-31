'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Row } from '@tanstack/react-table'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/animate-ui/components/radix/sheet'
import { DataTable } from '@/components/shadcn-studio/data-table/shared/data-table'
import { subscribers } from '@/components/shadcn-studio/data-table/subscribers/data'

import { jobOrderColumns, jobOrderColumnClassNames } from './columns'
import { jobOrders as initialJobOrders } from './data'
import { JobOrderForm } from './job-order-form'
import type { JobOrder } from './types'

const getNextTicketNumber = (jobOrders: JobOrder[]) => {
  const maxTicketNumber = jobOrders.reduce((max, jobOrder) => {
    const numericId = Number(jobOrder.ticketNumber.split('-').at(-1))

    return Number.isFinite(numericId) ? Math.max(max, numericId) : max
  }, 0)

  return `JO-2026-${String(maxTicketNumber + 1).padStart(4, '0')}`
}

function renderJobOrderExpandedRow(row: Row<JobOrder>) {
  return (
    <div className='border-t bg-muted/20 px-4 py-3'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Account Number</p>
          <p className='font-mono text-sm text-foreground'>{row.original.accountNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Phone Number</p>
          <p className='font-mono text-sm text-foreground'>{row.original.phoneNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Location</p>
          <p className='text-sm text-foreground'>{row.original.barangay}, {row.original.city}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Assigned Technician</p>
          <p className='text-sm font-medium text-foreground'>{row.original.technician}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Problem Category</p>
          <p className='text-sm text-foreground'>{row.original.problemCategory}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Created Date</p>
          <p className='text-sm text-foreground'>{row.original.createdDate}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-2'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Last Update</p>
          <p className='text-sm text-foreground'>{row.original.lastUpdate}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-4'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Problem Details</p>
          <p className='text-sm text-foreground'>{row.original.problemDetails}</p>
        </div>
      </div>
    </div>
  )
}

export default function JobOrdersDataTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(initialJobOrders)

  const isCreateOpen = searchParams.get('create') === '1'
  const nextTicketNumber = useMemo(() => getNextTicketNumber(jobOrders), [jobOrders])

  const closeCreateDrawer = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `?${params.toString()}` : '/main/job-orders', {
      scroll: false,
    })
  }

  const handleCreateJobOrder = (jobOrder: JobOrder) => {
    setJobOrders((currentJobOrders) => [jobOrder, ...currentJobOrders])
    closeCreateDrawer()
  }

  return (
    <>
      <DataTable
        columns={jobOrderColumns}
        data={jobOrders}
        columnClassNames={jobOrderColumnClassNames}
        itemLabel='job orders'
        minWidthClassName='min-w-[872px]'
        renderExpandedRow={renderJobOrderExpandedRow}
      />
      <Sheet open={isCreateOpen} onOpenChange={(open) => {
        if (!open) closeCreateDrawer()
      }}>
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
            onCancel={closeCreateDrawer}
            onSubmit={handleCreateJobOrder}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
